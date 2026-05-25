import { Types } from 'mongoose';
import { Template } from '../models/template.model.js';
import { Board } from '../models/board.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { NotFound } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

export async function list() {
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
