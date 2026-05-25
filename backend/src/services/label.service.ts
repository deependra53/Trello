import { Label } from '../models/label.model.js';
import { NotFound } from '../utils/errors.js';

export async function listForBoard(boardId: string) {
  return Label.find({ boardId }).lean();
}

export async function create(boardId: string, name: string, color: string) {
  return Label.create({ boardId, name, color });
}

export async function update(id: string, patch: { name?: string; color?: string }) {
  const label = await Label.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!label) throw NotFound('Label not found');
  return label;
}

export async function remove(id: string) {
  await Label.findByIdAndDelete(id);
}
