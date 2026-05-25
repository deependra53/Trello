import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { bus, BOARD_EVENT } from '../src/realtime/bus.js';
import {
  makeUser,
  makeWorkspace,
  makeBoard,
  makeList,
  makeCard,
} from './helpers.js';

const app = createApp();

describe('card move endpoint', () => {
  it('requires clientEventId', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);

    const res = await request(app)
      .post(`/api/cards/${card._id}/move`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ listId: list._id });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rejects when prevId === nextId', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const a = await makeCard(app, user, list._id, 'A');
    const card = await makeCard(app, user, list._id, 'C');

    const res = await request(app)
      .post(`/api/cards/${card._id}/move`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ listId: list._id, prevId: a._id, nextId: a._id, clientEventId: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rejects when target list is on another board', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const boardA = await makeBoard(app, user, ws._id, 'A');
    const boardB = await makeBoard(app, user, ws._id, 'B');
    const listA = await makeList(app, user, boardA._id);
    const listB = await makeList(app, user, boardB._id);
    const card = await makeCard(app, user, listA._id);

    const res = await request(app)
      .post(`/api/cards/${card._id}/move`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ listId: listB._id, clientEventId: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/different board/i);
  });

  it('broadcasts card.moved with clientEventId in payload', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);

    const events: { type: string; payload?: { clientEventId?: string; toList?: string } }[] = [];
    const handler = (e: typeof events[number]) => events.push(e);
    bus.on(BOARD_EVENT, handler);
    try {
      const res = await request(app)
        .post(`/api/cards/${card._id}/move`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ listId: list._id, clientEventId: 'evt-abc' });
      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 50));
      const moved = events.find((e) => e.type === 'card.moved');
      expect(moved?.payload?.clientEventId).toBe('evt-abc');
      expect(moved?.payload?.toList).toBe(list._id);
    } finally {
      bus.off(BOARD_EVENT, handler);
    }
  });
});

describe('list move endpoint', () => {
  it('requires clientEventId', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const res = await request(app)
      .post(`/api/lists/${list._id}/move`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('broadcasts list.moved with clientEventId', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const l1 = await makeList(app, user, board._id, 'L1');
    const l2 = await makeList(app, user, board._id, 'L2');

    const events: { type: string; payload?: { clientEventId?: string } }[] = [];
    const handler = (e: typeof events[number]) => events.push(e);
    bus.on(BOARD_EVENT, handler);
    try {
      const res = await request(app)
        .post(`/api/lists/${l2._id}/move`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ prevId: null, nextId: l1._id, clientEventId: 'lst-1' });
      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 50));
      const moved = events.find((e) => e.type === 'list.moved');
      expect(moved?.payload?.clientEventId).toBe('lst-1');
    } finally {
      bus.off(BOARD_EVENT, handler);
    }
  });
});
