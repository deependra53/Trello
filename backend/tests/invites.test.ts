import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeUser, makeWorkspace } from './helpers.js';
import * as inviteSvc from '../src/services/invite.service.js';

const app = createApp();

describe('organization invites', () => {
  it('lets an owner create an invite', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'invitee@test.dev', role: 'member' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('joins the inviting org on signup (no new org created)', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner, 'Acme');
    const { token } = await inviteSvc.createInvite(ws._id, 'invitee@test.dev', 'member', owner.id);

    const signup = await request(app).post('/api/auth/signup').send({
      email: 'invitee@test.dev',
      password: 'supersecret1',
      fullName: 'Invitee',
      inviteToken: token,
    });
    expect(signup.status).toBe(201);
    expect(signup.body.workspace._id).toBe(ws._id);

    // The invitee should only belong to the inviting org — no personal org was made.
    const list = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${signup.body.accessToken}`);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]._id).toBe(ws._id);
  });

  it('rejects signup with no org name and no invite', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'lonely@test.dev',
      password: 'supersecret1',
      fullName: 'Lonely',
    });
    expect(res.status).toBe(400);
  });

  // --- Authorization: the invite endpoint must be enforced server-side, not just
  // hidden in the UI. A direct API call from a non-admin must be rejected.

  async function addToWorkspace(
    owner: Awaited<ReturnType<typeof makeUser>>,
    workspaceId: string,
    member: Awaited<ReturnType<typeof makeUser>>,
    role: 'admin' | 'member' | 'guest',
  ) {
    await request(app)
      .post(`/api/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.id, role })
      .expect(201);
  }

  it('forbids a plain member from inviting people (403)', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addToWorkspace(owner, ws._id, member, 'member');

    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ email: 'outsider@test.dev', role: 'member' });
    expect(res.status).toBe(403);
  });

  it('forbids a guest from inviting people (403)', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const guest = await makeUser(app);
    await addToWorkspace(owner, ws._id, guest, 'guest');

    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${guest.token}`)
      .send({ email: 'outsider@test.dev', role: 'member' });
    expect(res.status).toBe(403);
  });

  it('forbids a non-member from inviting people (403)', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const outsider = await makeUser(app);

    const res = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ email: 'outsider@test.dev', role: 'member' });
    expect(res.status).toBe(403);
  });

  it('lets an admin invite, but cannot escalate an invite to owner (400)', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const admin = await makeUser(app);
    await addToWorkspace(owner, ws._id, admin, 'admin');

    const ok = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: 'newadmin@test.dev', role: 'admin' });
    expect(ok.status).toBe(201);

    const escalate = await request(app)
      .post(`/api/workspaces/${ws._id}/invites`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: 'wannabe-owner@test.dev', role: 'owner' });
    expect(escalate.status).toBe(400);
  });

  it('only the owner — not an admin — can change a member’s role', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const admin = await makeUser(app);
    const member = await makeUser(app);
    await addToWorkspace(owner, ws._id, admin, 'admin');
    await addToWorkspace(owner, ws._id, member, 'member');

    // An admin must not be able to promote anyone (owner-only endpoint).
    const adminAttempt = await request(app)
      .patch(`/api/workspaces/${ws._id}/members/${member.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'admin' });
    expect(adminAttempt.status).toBe(403);

    // The owner can.
    const ownerAttempt = await request(app)
      .patch(`/api/workspaces/${ws._id}/members/${member.id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: 'admin' });
    expect(ownerAttempt.status).toBe(200);
  });
});
