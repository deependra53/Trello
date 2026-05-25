import { Card } from '../models/card.model.js';
import { Notification } from '../models/notification.model.js';
import { logger } from '../config/logger.js';
import { emitUser, emitBoard } from '../realtime/bus.js';

const REMINDER_MARK = 'dueReminderSent';

/**
 * Look for cards due within the next REMIND_WINDOW_MS and emit a one-time
 * notification per (card, user). The reminder flag lives on a per-card mixed
 * field so we never re-notify.
 */
const REMIND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function runDueReminders(): Promise<void> {
  const now = new Date();
  const horizon = new Date(now.getTime() + REMIND_WINDOW_MS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = await (Card as any).find({
    archived: false,
    dueComplete: false,
    dueDate: { $gte: now, $lte: horizon },
    [`customFieldValues.${REMINDER_MARK}`]: { $ne: true },
  })
    .select('_id title boardId members watchers dueDate customFieldValues')
    .lean();

  for (const card of cards) {
    const recipients = new Set<string>([
      ...(card.members ?? []).map((m: unknown) => String(m)),
      ...(card.watchers ?? []).map((w: unknown) => String(w)),
    ]);
    if (recipients.size === 0) continue;

    const docs = [...recipients].map((uid) => ({
      userId: uid,
      type: 'card.due-soon',
      title: `Due soon: ${card.title}`,
      body: `Due ${new Date(card.dueDate).toLocaleString()}`,
      boardId: card.boardId,
      cardId: card._id,
      link: `/boards/${card.boardId}/c/${card._id}`,
    }));

    const inserted = await Notification.insertMany(docs);
    for (const n of inserted) {
      emitUser({
        userId: String(n.userId),
        type: 'notification.new',
        payload: { notification: n.toJSON() },
      });
    }

    emitBoard({
      boardId: String(card.boardId),
      type: 'card.due-soon',
      payload: { cardId: String(card._id) },
    });

    await Card.updateOne(
      { _id: card._id },
      { $set: { [`customFieldValues.${REMINDER_MARK}`]: true } },
    );
  }

  if (cards.length > 0) logger.info({ count: cards.length }, 'sent due reminders');
}

export function startDueReminderCron(): NodeJS.Timeout {
  // Every 5 minutes
  return setInterval(() => {
    runDueReminders().catch((e) => logger.error(e, 'due reminder run failed'));
  }, 5 * 60 * 1000);
}
