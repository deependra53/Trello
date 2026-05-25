import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeUser, makeWorkspace, makeBoard, makeList, makeCard } from './helpers.js';

const app = createApp();

describe('boards / lists / cards', () => {
  it('creates a board with lists and cards, returns full board on GET', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id, 'Roadmap');
    const list = await makeList(app, user, board._id, 'Backlog');
    const card = await makeCard(app, user, list._id, 'Ship MVP');

    const full = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(full.status).toBe(200);
    expect(full.body.title).toBe('Roadmap');
    expect(full.body.lists).toHaveLength(1);
    expect(full.body.cards).toHaveLength(1);
    expect(full.body.cards[0]._id).toBe(card._id);
  });

  it('forbids non-member access to private board', async () => {
    const owner = await makeUser(app);
    const stranger = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id);
    // Change visibility to private
    await request(app)
      .patch(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ visibility: 'private' })
      .expect(200);
    const res = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(res.status).toBe(403);
  });

  it('moves a card to a different list', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const l1 = await makeList(app, user, board._id, 'L1');
    const l2 = await makeList(app, user, board._id, 'L2');
    const card = await makeCard(app, user, l1._id);
    const res = await request(app)
      .post(`/api/cards/${card._id}/move`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ listId: l2._id });
    expect(res.status).toBe(200);
    expect(res.body.listId).toBe(l2._id);
  });

  it('toggles card members idempotently', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);

    const add = await request(app)
      .post(`/api/cards/${card._id}/members`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ userId: user.id });
    expect(add.status).toBe(200);
    expect(add.body.members).toContain(user.id);

    const remove = await request(app)
      .post(`/api/cards/${card._id}/members`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ userId: user.id });
    expect(remove.body.members).not.toContain(user.id);
  });

  it('adds and lists comments with activity log', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user);
    const board = await makeBoard(app, user, ws._id);
    const list = await makeList(app, user, board._id);
    const card = await makeCard(app, user, list._id);
    const add = await request(app)
      .post(`/api/cards/${card._id}/comments`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ body: 'Hello world', mentions: [] });
    expect(add.status).toBe(201);
    const list2 = await request(app)
      .get(`/api/cards/${card._id}/comments`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(list2.body.items).toHaveLength(1);

    const act = await request(app)
      .get(`/api/boards/${board._id}/activity`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(act.body.items.some((a: { type: string }) => a.type === 'card.comment.added')).toBe(true);
  });

  it('observer cannot edit cards', async () => {
    const owner = await makeUser(app);
    const observer = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    // add observer to workspace so they can access
    await request(app)
      .post(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: observer.email, role: 'guest' });
    const board = await makeBoard(app, owner, ws._id);
    await request(app)
      .post(`/api/boards/${board._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: observer.id, role: 'observer' });
    const list = await makeList(app, owner, board._id);
    const card = await makeCard(app, owner, list._id);

    const res = await request(app)
      .patch(`/api/cards/${card._id}`)
      .set('Authorization', `Bearer ${observer.token}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });
});
