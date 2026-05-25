import { Card } from '../models/card.model.js';
import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';

export async function search(userId: string, q: string) {
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const userBoards = await Board.find({
    closed: false,
    $or: [{ 'members.userId': userId }, { visibility: 'public' }],
  })
    .select('_id title workspaceId')
    .lean();
  const boardIds = userBoards.map((b) => b._id);

  const [cards, boards, members] = await Promise.all([
    Card.find({
      boardId: { $in: boardIds },
      archived: false,
      $or: [{ title: regex }, { description: regex }],
    })
      .limit(20)
      .lean(),
    Board.find({
      _id: { $in: boardIds },
      title: regex,
    })
      .limit(20)
      .lean(),
    User.find({ $or: [{ fullName: regex }, { email: regex }] })
      .select('_id fullName email avatarUrl')
      .limit(10)
      .lean(),
  ]);

  return { cards, boards, members };
}

export async function searchWorkspaces(userId: string, q: string) {
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return Workspace.find({
    name: regex,
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
  })
    .limit(10)
    .lean();
}
