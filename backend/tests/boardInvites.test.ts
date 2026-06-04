import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeUser, makeWorkspace, makeBoard } from './helpers.js';
import * as inviteSvc from '../src/services/boardInvite.service.js';

const app = createApp();

describe('board sharing — link + email invites', () => {
  it('lets an outsider join a board (and the org as guest) via the share link', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id, 'Shared board');

    // Admin enables the share link.
    const linkRes = await request(app)
      .post(`/api/boards/${board._id}/share-link`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({});
    expect(linkRes.status).toBe(201);
    expect(linkRes.body.enabled).toBe(true);
    expect(typeof linkRes.body.token).toBe('string');
    const token = linkRes.body.token as string;

    // A user from a completely different org cannot see the board yet.
    const outsider = await makeUser(app);
    const before = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(before.status).toBe(403);

    // They accept the link...
    const accept = await request(app)
      .post('/api/boards/accept-invite')
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ token });
    expect(accept.status).toBe(200);
    expect(accept.body.boardId).toBe(board._id);

    // ...and now they can open the board as a member.
    const after = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(after.status).toBe(200);
    expect(after.body.members.some((m: { userId: string; role: string }) => m.userId === outsider.id && m.role === 'member')).toBe(true);

    // The board's org now lists them as a guest.
    const members = await request(app)
      .get(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(members.body.items.some((m: { userId: string; role: string }) => m.userId === outsider.id && m.role === 'guest')).toBe(true);
  });

  it('share link is reusable and previewable', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id, 'Reusable');
    const link = await inviteSvc.enableShareLink(board._id, owner.id, {});

    // Public preview works without auth.
    const preview = await request(app).get(`/api/boards/invite-info/${link.token}`);
    expect(preview.status).toBe(200);
    expect(preview.body.boardTitle).toBe('Reusable');

    // Two different users can both join the same link.
    const a = await makeUser(app);
    const b = await makeUser(app);
    for (const u of [a, b]) {
      const res = await request(app)
        .post('/api/boards/accept-invite')
        .set('Authorization', `Bearer ${u.token}`)
        .send({ token: link.token });
      expect(res.status).toBe(200);
    }
  });

  it('disabling the share link stops new joins', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id);
    const link = await inviteSvc.enableShareLink(board._id, owner.id, {});

    await request(app)
      .delete(`/api/boards/${board._id}/share-link`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(204);

    const outsider = await makeUser(app);
    const res = await request(app)
      .post('/api/boards/accept-invite')
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ token: link.token });
    expect(res.status).toBe(400);
  });

  it('sends a single-use email invite that joins on accept', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id, 'Email board');

    const created = await request(app)
      .post(`/api/boards/${board._id}/invites`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: 'guest@test.dev', role: 'member' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');
    expect(created.body).not.toHaveProperty('token');
    expect(created.body).not.toHaveProperty('tokenHash');

    const list = await request(app)
      .get(`/api/boards/${board._id}/invites`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(list.body.items).toHaveLength(1);

    // Use the service to get the raw token (never exposed over the API).
    const { token } = await inviteSvc.createEmailInvite(board._id, 'guest2@test.dev', 'member', owner.id);
    const joiner = await makeUser(app);
    const accept = await request(app)
      .post('/api/boards/accept-invite')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ token });
    expect(accept.status).toBe(200);

    // A single-use email invite cannot be used twice.
    const again = await request(app)
      .post('/api/boards/accept-invite')
      .set('Authorization', `Bearer ${joiner.token}`)
      .send({ token });
    expect(again.status).toBe(400);
  });

  it('joins the board + org (as guest) on signup, without creating a personal org', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner, 'Marketing');
    const board = await makeBoard(app, owner, ws._id, 'Campaign');
    const { token } = await inviteSvc.createEmailInvite(board._id, 'newbie@test.dev', 'member', owner.id);

    const signup = await request(app).post('/api/auth/signup').send({
      email: 'newbie@test.dev',
      password: 'supersecret1',
      fullName: 'Newbie',
      boardInviteToken: token,
    });
    expect(signup.status).toBe(201);
    const newUserId = signup.body.user.id ?? signup.body.user._id;
    const newToken = signup.body.accessToken as string;

    // Only belongs to the inviting org — no personal org was created.
    const orgs = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${newToken}`);
    expect(orgs.body.items).toHaveLength(1);
    expect(orgs.body.items[0]._id).toBe(ws._id);

    // Member of the board they were invited to.
    const full = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${newToken}`);
    expect(full.status).toBe(200);
    expect(full.body.members.some((m: { userId: string; role: string }) => m.userId === newUserId && m.role === 'member')).toBe(true);

    // Guest in the org.
    const members = await request(app)
      .get(`/api/workspaces/${ws._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(members.body.items.some((m: { userId: string; role: string }) => m.userId === newUserId && m.role === 'guest')).toBe(true);
  });

  it('keeps board-invite guests out of chat until an admin adds them to a channel', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner, 'Org');
    const board = await makeBoard(app, owner, ws._id, 'Board');

    // A public channel the org members can see.
    const chRes = await request(app)
      .post(`/api/chat/workspaces/${ws._id}/channels`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'general', isPrivate: false });
    expect(chRes.status).toBe(201);
    const channelId = chRes.body._id;

    // A guest joins via a board invite.
    const { token } = await inviteSvc.createEmailInvite(board._id, 'guest@test.dev', 'member', owner.id);
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'guest@test.dev',
      password: 'supersecret1',
      fullName: 'Guest',
      boardInviteToken: token,
    });
    const guestId = signup.body.user.id ?? signup.body.user._id;
    const guestToken = signup.body.accessToken as string;

    // Guest sees no channels and can't open the public one.
    const list1 = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/channels`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(list1.status).toBe(200);
    expect(list1.body.items).toHaveLength(0);
    await request(app)
      .get(`/api/chat/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(403);

    // Admin adds the guest to the channel — now they have chat access to it.
    await request(app)
      .post(`/api/chat/channels/${channelId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userIds: [guestId] })
      .expect(200);

    const list2 = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/channels`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(list2.body.items.some((c: { _id: string }) => c._id === channelId)).toBe(true);
    await request(app)
      .get(`/api/chat/channels/${channelId}/messages`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200);
  });

  it('forbids non-admins from sharing and rejects bad tokens', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const board = await makeBoard(app, owner, ws._id);

    const stranger = await makeUser(app);
    await request(app)
      .post(`/api/boards/${board._id}/share-link`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({})
      .expect(403);
    await request(app)
      .post(`/api/boards/${board._id}/invites`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ email: 'x@test.dev' })
      .expect(403);

    await request(app).get('/api/boards/invite-info/not-a-real-token').expect(404);
    await request(app)
      .post('/api/boards/accept-invite')
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ token: 'not-a-real-token' })
      .expect(400);
  });
});
