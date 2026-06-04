import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeUser, makeWorkspace } from './helpers.js';

const app = createApp();

describe('workspaces', () => {
  it('creates and lists workspaces for a user', async () => {
    const user = await makeUser(app);
    const ws = await makeWorkspace(app, user, 'Acme');
    expect(ws.name).toBe('Acme');
    expect(ws.ownerId).toBe(user.id);

    const listRes = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`);
    expect(listRes.status).toBe(200);
    // One org is auto-created at signup, plus the 'Acme' workspace created above.
    expect(listRes.body.items.length).toBe(2);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/workspaces');
    expect(res.status).toBe(401);
  });

  it('forbids access for non-members', async () => {
    const owner = await makeUser(app);
    const stranger = await makeUser(app);
    const ws = await makeWorkspace(app, owner);

    const res = await request(app)
      .get(`/api/workspaces/${ws._id}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(res.status).toBe(403);
  });

  it('allows owner to invite an existing user', async () => {
    const owner = await makeUser(app);
    const invitee = await makeUser(app);
    const ws = await makeWorkspace(app, owner);

    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: invitee.email, role: 'member' });
    expect(res.status).toBe(201);

    // The invitee can now read the workspace
    const r2 = await request(app)
      .get(`/api/workspaces/${ws._id}`)
      .set('Authorization', `Bearer ${invitee.token}`);
    expect(r2.status).toBe(200);
  });

  it('rejects member trying to invite (admin-only)', async () => {
    const owner = await makeUser(app);
    const member = await makeUser(app);
    const third = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    await request(app)
      .post(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: member.email, role: 'member' })
      .expect(201);
    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ email: third.email });
    expect(res.status).toBe(403);
  });
});
