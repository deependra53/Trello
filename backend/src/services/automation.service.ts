import { Automation } from '../models/automation.model.js';
import { NotFound } from '../utils/errors.js';

export async function list(boardId: string) {
  return Automation.find({ boardId }).sort({ createdAt: -1 }).lean();
}

export async function create(
  boardId: string,
  createdBy: string,
  input: Record<string, unknown>,
) {
  return Automation.create({ ...input, boardId, createdBy });
}

export async function update(id: string, patch: Record<string, unknown>) {
  const a = await Automation.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!a) throw NotFound('Automation not found');
  return a;
}

export async function remove(id: string) {
  await Automation.findByIdAndDelete(id);
}

/**
 * Stub runner — full engine lands in Phase 3. For now it bumps counters so
 * we can wire UI against a real endpoint.
 */
export async function run(id: string) {
  const a = await Automation.findById(id);
  if (!a) throw NotFound('Automation not found');
  a.runCount = (a.runCount ?? 0) + 1;
  a.lastRunAt = new Date();
  await a.save();
  return a;
}
