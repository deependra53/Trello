import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Card } from '../src/models/card.model.js';
import { makeUser, makeWorkspace, makeBoard, makeList, makeCard } from './helpers.js';

const app = createApp();

describe('attachments', () => {
  it('uploads an attachment to a card', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);

    const res = await request(app)
      .post(`/api/cards/${card._id}/attachments`)
      .set('Authorization', `Bearer ${user.token}`)
      .attach('file', Buffer.from('hello world'), 'note.txt');
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('note.txt');
    expect(res.body.url).toMatch(/^\/uploads\//);

    const fresh = await Card.findById(card._id).lean();
    expect(fresh?.attachments?.length).toBe(1);
  });

  it('rejects upload without a file', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);

    const res = await request(app)
      .post(`/api/cards/${card._id}/attachments`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(400);
  });
});
