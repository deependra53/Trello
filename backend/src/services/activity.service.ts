import { Types } from 'mongoose';
import { Activity } from '../models/activity.model.js';
import { Board } from '../models/board.model.js';
import { logger } from '../config/logger.js';

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
  } catch (err) {
    logger.error(err, 'failed to log activity');
  }
}
