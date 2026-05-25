import { Types } from 'mongoose';
import { Activity } from '../models/activity.model.js';
import { Board } from '../models/board.model.js';
import { logger } from '../config/logger.js';
import { emitBoard } from '../realtime/bus.js';

export interface ActivityInput {
  boardId: string | Types.ObjectId;
  cardId?: string | Types.ObjectId;
  listId?: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  type: string;
  payload?: Record<string, unknown>;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await Activity.create(input);
    await Board.updateOne({ _id: input.boardId }, { $set: { lastActivityAt: new Date() } });
    emitBoard({
      boardId: String(input.boardId),
      type: input.type,
      actorId: String(input.actorId),
      payload: {
        ...input.payload,
        cardId: input.cardId ? String(input.cardId) : undefined,
        listId: input.listId ? String(input.listId) : undefined,
      },
    });
  } catch (err) {
    logger.error(err, 'failed to log activity');
  }
}
