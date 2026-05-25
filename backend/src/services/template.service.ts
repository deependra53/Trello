import { Types } from 'mongoose';
import { Template } from '../models/template.model.js';
import { Board } from '../models/board.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { NotFound } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

const DEFAULT_TEMPLATES = [
  {
    name: 'Sprint Board',
    description: 'Plan and ship a two-week sprint.',
    category: 'engineering',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#795DFF,#9B7BFF)' },
    structure: {
      lists: [
        { title: 'Backlog', cards: [{ title: 'Refine ticket scope', description: '' }] },
        { title: 'This Sprint', cards: [{ title: 'Kickoff meeting', description: '' }] },
        { title: 'In Progress', cards: [] },
        { title: 'Review', cards: [] },
        { title: 'Done', cards: [] },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Personal Kanban',
    description: 'Get things done across the week.',
    category: 'personal',
    background: { type: 'color', value: '#22A186' },
    structure: {
      lists: [
        { title: 'Inbox', cards: [{ title: 'Capture an idea' }] },
        { title: 'Today', cards: [] },
        { title: 'This Week', cards: [] },
        { title: 'Waiting On', cards: [] },
        { title: 'Done', cards: [] },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Product Roadmap',
    description: 'Communicate what is shipping and when.',
    category: 'product',
    background: { type: 'gradient', value: 'linear-gradient(135deg,#FF6B6B,#FFA8A8)' },
    structure: {
      lists: [
        { title: 'Discovery' },
        { title: 'Now' },
        { title: 'Next' },
        { title: 'Later' },
        { title: 'Shipped' },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Marketing Calendar',
    description: 'Coordinate campaigns and launches.',
    category: 'marketing',
    background: { type: 'color', value: '#F2994A' },
    structure: {
      lists: [
        { title: 'Ideas' },
        { title: 'Drafts' },
        { title: 'Scheduled' },
        { title: 'Published' },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Bug Tracker',
    description: 'Triage and ship fixes faster.',
    category: 'engineering',
    background: { type: 'color', value: '#EB5757' },
    structure: {
      lists: [
        { title: 'Reported' },
        { title: 'Triage' },
        { title: 'In Progress' },
        { title: 'Verifying' },
        { title: 'Closed' },
      ],
    },
    isPublic: true,
  },
  {
    name: 'Editorial Calendar',
    description: 'Plan posts from draft to publish.',
    category: 'content',
    background: { type: 'color', value: '#2D9CDB' },
    structure: {
      lists: [
        { title: 'Pitch' },
        { title: 'Drafting' },
        { title: 'Editing' },
        { title: 'Scheduled' },
        { title: 'Published' },
      ],
    },
    isPublic: true,
  },
];

async function ensureSeeded() {
  const count = await Template.estimatedDocumentCount();
  if (count === 0) {
    await Template.insertMany(DEFAULT_TEMPLATES);
  }
}

export async function list() {
  await ensureSeeded().catch(() => undefined);
  return Template.find({ isPublic: true }).sort({ useCount: -1 }).lean();
}

export async function createBoardFromTemplate(
  templateId: string,
  workspaceId: string,
  title: string,
  creatorId: string,
) {
  const template = await Template.findById(templateId);
  if (!template) throw NotFound('Template not found');

  const board = await Board.create({
    workspaceId,
    title,
    description: template.description,
    background: template.background ?? { type: 'color', value: '#0079bf' },
    visibility: 'workspace',
    members: [{ userId: new Types.ObjectId(creatorId), role: 'admin', joinedAt: new Date() }],
    lastActivityAt: new Date(),
  });

  const structure = (template.structure ?? {}) as {
    lists?: Array<{ title: string; cards?: Array<{ title: string; description?: string }> }>;
  };

  let listPos = 65_536;
  for (const lst of structure.lists ?? []) {
    const newList = await List.create({
      boardId: board._id,
      title: lst.title,
      position: listPos,
    });
    listPos += 65_536;

    let cardPos = 65_536;
    for (const c of lst.cards ?? []) {
      await Card.create({
        boardId: board._id,
        listId: newList._id,
        title: c.title,
        description: c.description ?? '',
        position: cardPos,
      });
      cardPos += 65_536;
    }
  }

  template.useCount = (template.useCount ?? 0) + 1;
  await template.save();
  await logActivity({
    boardId: board._id,
    actorId: creatorId,
    type: 'board.created.from-template',
    payload: { templateId },
  });
  return board;
}
