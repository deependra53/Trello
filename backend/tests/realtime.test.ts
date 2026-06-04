import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { bus, BOARD_EVENT, USER_EVENT } from '../src/realtime/bus.js';
import { makeUser, makeWorkspace, makeBoard, makeList } from './helpers.js';

const app = createApp();

describe('realtime bus', () => {
  it('emits board events when mutations happen', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);

    const events: unknown[] = [];
    const handler = (e: unknown) => events.push(e);
    bus.on(BOARD_EVENT, handler);

    try {
      await makeList(app, user, board._id, 'New');
      // small wait for any async logActivity
      await new Promise((r) => setTimeout(r, 50));
      expect(events.length).toBeGreaterThan(0);
      const evt = events.find((e) => (e as { type: string }).type === 'list.created') as
        | { boardId: string }
        | undefined;
      expect(evt?.boardId).toBe(board._id);
    } finally {
      bus.off(BOARD_EVENT, handler);
    }
  });

  it('broadcasts the full comment to the board room when someone comments', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const cardRes = await request(app)
      .post(`/api/lists/${list._id}/cards`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Card' });
    const card = cardRes.body;

    const events: Array<{ boardId: string; type: string; actorId?: string; payload?: Record<string, unknown> }> = [];
    const handler = (e: unknown) => events.push(e as (typeof events)[number]);
    bus.on(BOARD_EVENT, handler);
    try {
      await request(app)
        .post(`/api/cards/${card._id}/comments`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ body: 'live comment', mentions: [] })
        .expect(201);
      await new Promise((r) => setTimeout(r, 50));

      const evt = events.find((e) => e.type === 'card.comment.created');
      expect(evt).toBeDefined();
      expect(evt?.boardId).toBe(board._id);
      expect(evt?.actorId).toBe(user.id);
      const payload = evt?.payload as
        | { cardId: string; comment: { _id: string; body: string }; author?: { fullName: string } }
        | undefined;
      expect(payload?.cardId).toBe(card._id);
      expect(payload?.comment?.body).toBe('live comment');
      expect(payload?.comment?._id).toBeTruthy();
      expect(payload?.author?.fullName).toBe(user.fullName);
    } finally {
      bus.off(BOARD_EVENT, handler);
    }
  });

  it('emits user notification when commenter mentions a watcher', async () => {
    const author = await makeUser(app);
    const watcher = await makeUser(app);
    const ws = await makeWorkspace(app, author);
    // share workspace + board
    await request(app)
      .post(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ email: watcher.email, role: 'member' });
    const board = await makeBoard(app, author, ws._id);
    await request(app)
      .post(`/api/boards/${board._id}/members`)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ userId: watcher.id, role: 'member' });
    const list = await makeList(app, author, board._id);
    const cardRes = await request(app)
      .post(`/api/lists/${list._id}/cards`)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ title: 'X' });
    const card = cardRes.body;
    // Make the watcher actually watch the card
    await request(app)
      .post(`/api/cards/${card._id}/watch`)
      .set('Authorization', `Bearer ${watcher.token}`);

    const userEvents: unknown[] = [];
    const handler = (e: unknown) => userEvents.push(e);
    bus.on(USER_EVENT, handler);
    try {
      await request(app)
        .post(`/api/cards/${card._id}/comments`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ body: 'hello', mentions: [] });
      await new Promise((r) => setTimeout(r, 50));
      const notif = userEvents.find(
        (e) =>
          (e as { userId: string; type: string }).type === 'notification.new' &&
          (e as { userId: string }).userId === watcher.id,
      );
      expect(notif).toBeDefined();
    } finally {
      bus.off(USER_EVENT, handler);
    }
  });
});
