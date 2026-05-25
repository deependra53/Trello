import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { startAutomationEngine } from '../src/services/automation.engine.js';
import { Card } from '../src/models/card.model.js';
import { makeUser, makeWorkspace, makeBoard, makeList, makeCard } from './helpers.js';

const app = createApp();
startAutomationEngine();

describe('automation engine', () => {
  it('runs an add_label action when a card is created on a target list', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);

    // Create a label
    const labelRes = await request(app)
      .post(`/api/boards/${board._id}/labels`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'auto', color: 'green' });
    expect(labelRes.status).toBe(201);
    const labelId = labelRes.body._id as string;

    // Create automation: on card.created, add label
    const autoRes = await request(app)
      .post(`/api/boards/${board._id}/automations`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        name: 'auto-label',
        trigger: { type: 'card.created', config: {} },
        actions: [{ type: 'add_label', config: { labelId } }],
      });
    expect(autoRes.status).toBe(201);

    // Trigger by creating a card
    const card = await makeCard(app, user, list._id, 'will be labeled');
    // Let async automation engine run
    await new Promise((r) => setTimeout(r, 150));

    const fresh = await Card.findById(card._id).lean();
    expect(fresh?.labels?.map((l) => String(l))).toContain(labelId);
  });
});
