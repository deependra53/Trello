import { Types } from 'mongoose';
import { Automation } from '../models/automation.model.js';
import { Card } from '../models/card.model.js';
import { List } from '../models/list.model.js';
import { Notification } from '../models/notification.model.js';
import { Comment } from '../models/comment.model.js';
import { logger } from '../config/logger.js';
import { bus, BOARD_EVENT, emitUser, type BoardEvent } from '../realtime/bus.js';
import { logActivity } from './activity.service.js';

type Op = 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt' | 'contains' | 'exists';

interface Condition {
  field: string;
  op: Op;
  value?: unknown;
}

interface ActionDef {
  type: string;
  config: Record<string, unknown>;
}

function getField(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function evalCondition(c: Condition, ctx: Record<string, unknown>): boolean {
  const v = getField(ctx, c.field);
  switch (c.op) {
    case 'eq':
      return v === c.value;
    case 'neq':
      return v !== c.value;
    case 'in':
      return Array.isArray(c.value) && (c.value as unknown[]).includes(v);
    case 'nin':
      return Array.isArray(c.value) && !(c.value as unknown[]).includes(v);
    case 'gt':
      return typeof v === 'number' && typeof c.value === 'number' && v > c.value;
    case 'lt':
      return typeof v === 'number' && typeof c.value === 'number' && v < c.value;
    case 'contains':
      return typeof v === 'string' && typeof c.value === 'string' && v.includes(c.value);
    case 'exists':
      return v !== undefined && v !== null;
  }
}

function triggerMatches(triggerType: string, eventType: string): boolean {
  return triggerType === eventType;
}

async function runAction(boardId: string, cardId: string | undefined, action: ActionDef, actorId: string) {
  const cfg = action.config ?? {};
  switch (action.type) {
    case 'move_card': {
      if (!cardId || !cfg.listId) return;
      await Card.updateOne({ _id: cardId }, { $set: { listId: new Types.ObjectId(String(cfg.listId)) } });
      break;
    }
    case 'add_label': {
      if (!cardId || !cfg.labelId) return;
      await Card.updateOne(
        { _id: cardId },
        { $addToSet: { labels: new Types.ObjectId(String(cfg.labelId)) } },
      );
      break;
    }
    case 'remove_label': {
      if (!cardId || !cfg.labelId) return;
      await Card.updateOne(
        { _id: cardId },
        { $pull: { labels: new Types.ObjectId(String(cfg.labelId)) } },
      );
      break;
    }
    case 'assign_member': {
      if (!cardId || !cfg.userId) return;
      await Card.updateOne(
        { _id: cardId },
        { $addToSet: { members: new Types.ObjectId(String(cfg.userId)) } },
      );
      break;
    }
    case 'unassign_member': {
      if (!cardId || !cfg.userId) return;
      await Card.updateOne(
        { _id: cardId },
        { $pull: { members: new Types.ObjectId(String(cfg.userId)) } },
      );
      break;
    }
    case 'set_due': {
      if (!cardId) return;
      const days = Number(cfg.daysFromNow) || 0;
      const due = new Date(Date.now() + days * 86_400_000);
      await Card.updateOne({ _id: cardId }, { $set: { dueDate: due } });
      break;
    }
    case 'clear_due': {
      if (!cardId) return;
      await Card.updateOne({ _id: cardId }, { $unset: { dueDate: '' } });
      break;
    }
    case 'archive': {
      if (!cardId) return;
      await Card.updateOne({ _id: cardId }, { $set: { archived: true } });
      break;
    }
    case 'post_comment': {
      if (!cardId || !cfg.body) return;
      await Comment.create({
        cardId,
        boardId,
        authorId: actorId,
        body: String(cfg.body),
      });
      break;
    }
    case 'create_card': {
      if (!cfg.listId || !cfg.title) return;
      const list = await List.findById(String(cfg.listId)).lean();
      if (!list) return;
      await Card.create({
        listId: cfg.listId,
        boardId: list.boardId,
        title: String(cfg.title),
        description: String(cfg.description ?? ''),
        position: Date.now(),
      });
      break;
    }
    case 'send_notification': {
      if (!cfg.userId || !cfg.title) return;
      const n = await Notification.create({
        userId: cfg.userId,
        type: 'automation',
        title: String(cfg.title),
        body: String(cfg.body ?? ''),
        boardId,
        cardId,
      });
      emitUser({
        userId: String(cfg.userId),
        type: 'notification.new',
        payload: { notification: n.toJSON() },
      });
      break;
    }
    default:
      logger.warn({ type: action.type }, 'unknown automation action');
  }
}

async function buildContext(event: BoardEvent): Promise<Record<string, unknown>> {
  const ctx: Record<string, unknown> = { ...event.payload };
  const cardId = event.payload?.cardId as string | undefined;
  if (cardId) {
    const card = await Card.findById(cardId).lean();
    if (card) ctx.card = card;
  }
  return ctx;
}

export function startAutomationEngine(): void {
  bus.on(BOARD_EVENT, async (event: BoardEvent) => {
    try {
      const rules = await Automation.find({ boardId: event.boardId, enabled: true }).lean();
      const cardId = event.payload?.cardId as string | undefined;
      for (const rule of rules) {
        if (!triggerMatches(rule.trigger.type, event.type)) continue;
        const ctx = await buildContext(event);
        const conditions = (rule.conditions ?? []) as Condition[];
        const results = conditions.map((c) => evalCondition(c, ctx));
        const matched = rule.conditionMatch === 'any'
          ? results.length === 0 || results.some(Boolean)
          : results.every(Boolean);
        if (!matched) continue;

        for (const action of (rule.actions ?? []) as ActionDef[]) {
          await runAction(event.boardId, cardId, action, String(rule.createdBy));
        }
        await Automation.updateOne(
          { _id: rule._id },
          { $inc: { runCount: 1 }, $set: { lastRunAt: new Date() } },
        );
        await logActivity({
          boardId: event.boardId,
          cardId,
          actorId: String(rule.createdBy),
          type: 'automation.run',
          payload: { name: rule.name, ruleId: rule._id },
        });
      }
    } catch (err) {
      logger.error(err, 'automation engine error');
    }
  });
  logger.info('automation engine started');
}
