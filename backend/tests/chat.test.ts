import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeUser, makeWorkspace, type TestUser } from './helpers.js';
import { bus, CHANNEL_EVENT, USER_EVENT, type ChannelEvent, type UserEvent } from '../src/realtime/bus.js';

const app = createApp();

async function addMember(owner: TestUser, wsId: string, member: TestUser, role = 'member') {
  await request(app)
    .post(`/api/workspaces/${wsId}/members`)
    .set('Authorization', `Bearer ${owner.token}`)
    .send({ email: member.email, role })
    .expect(201);
}

function createChannel(user: TestUser, wsId: string, body: Record<string, unknown>) {
  return request(app)
    .post(`/api/chat/workspaces/${wsId}/channels`)
    .set('Authorization', `Bearer ${user.token}`)
    .send(body);
}

function postMessage(user: TestUser, channelId: string, body: Record<string, unknown>) {
  return request(app)
    .post(`/api/chat/channels/${channelId}/messages`)
    .set('Authorization', `Bearer ${user.token}`)
    .send(body);
}

describe('chat', () => {
  it('creates a channel and posts/lists messages', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general', isPrivate: false });
    expect(ch.status).toBe(201);

    const msg = await postMessage(owner, ch.body._id, { body: 'hello world' });
    expect(msg.status).toBe(201);
    expect(msg.body.body).toBe('hello world');

    const list = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].author.fullName).toBe(owner.fullName);
  });

  it('on send, emits message.new to the channel and chat.activity to every other member', async () => {
    // `chat.activity` (a user-room signal) is the reliable backstop the client uses
    // to catch up when it has fallen out of the channel room — e.g. after a socket
    // reconnect, where the server re-joins the user room but NOT channel rooms. If
    // this stops firing for recipients, missed-message recovery breaks silently.
    const owner = await makeUser(app);
    const member = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    await addMember(owner, ws._id, member);
    const ch = await createChannel(owner, ws._id, { name: 'general', isPrivate: false });
    // The member auto-joins a public channel by posting, becoming a member.
    await postMessage(member, ch.body._id, { body: 'hi from member' }).expect(201);

    const channelEvents: ChannelEvent[] = [];
    const userEvents: UserEvent[] = [];
    const onChannel = (e: ChannelEvent) => channelEvents.push(e);
    const onUser = (e: UserEvent) => userEvents.push(e);
    bus.on(CHANNEL_EVENT, onChannel);
    bus.on(USER_EVENT, onUser);
    try {
      await postMessage(owner, ch.body._id, { body: 'broadcast me', clientId: 'cid-1' }).expect(201);
      await new Promise((r) => setTimeout(r, 50));

      const newMsg = channelEvents.find((e) => e.type === 'message.new');
      expect(newMsg?.channelId).toBe(ch.body._id);
      const payload = newMsg?.payload as { message?: { body?: string; clientId?: string } } | undefined;
      expect(payload?.message?.body).toBe('broadcast me');
      expect(payload?.message?.clientId).toBe('cid-1'); // echoed so the sender's optimistic msg reconciles

      // The OTHER member gets a user-room activity ping; the author does NOT.
      const activity = userEvents.filter((e) => e.type === 'chat.activity');
      expect(
        activity.some(
          (e) => e.userId === member.id && (e.payload as { channelId?: string })?.channelId === ch.body._id,
        ),
      ).toBe(true);
      expect(activity.some((e) => e.userId === owner.id)).toBe(false);
    } finally {
      bus.off(CHANNEL_EVENT, onChannel);
      bus.off(USER_EVENT, onUser);
    }
  });

  it('echoes the sender clientId so optimistic messages can reconcile', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general', isPrivate: false });

    const msg = await postMessage(owner, ch.body._id, { body: 'hi', clientId: 'tmp-123' });
    expect(msg.status).toBe(201);
    // The response carries the correlation id back to the sender...
    expect(msg.body.clientId).toBe('tmp-123');
    // ...but it is never persisted on the stored message.
    const list = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(list.body.items[0].clientId).toBeUndefined();
  });

  it('dedupes 1:1 DMs regardless of who opens them', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const dm1 = await request(app)
      .post(`/api/chat/workspaces/${ws._id}/dms`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userIds: [member.id] });
    const dm2 = await request(app)
      .post(`/api/chat/workspaces/${ws._id}/dms`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ userIds: [owner.id] });

    expect(dm1.status).toBe(201);
    expect(dm2.body._id).toBe(dm1.body._id);
  });

  it('denies private-channel access to non-members', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const ch = await createChannel(owner, ws._id, { name: 'secret', isPrivate: true });
    const res = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(res.status).toBe(403);
  });

  it('lets any org member read & auto-join a public channel by posting', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const ch = await createChannel(owner, ws._id, { name: 'general', isPrivate: false });
    const read = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(read.status).toBe(200);

    const post = await postMessage(member, ch.body._id, { body: 'joining in' });
    expect(post.status).toBe(201);
  });

  it('tracks unread counts and clears them on read', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const ch = await createChannel(owner, ws._id, { name: 'general', memberIds: [member.id] });
    await postMessage(owner, ch.body._id, { body: 'hi there' });

    const unread = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/unread`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(unread.body.byChannel[ch.body._id]).toBe(1);

    await request(app)
      .post(`/api/chat/channels/${ch.body._id}/read`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(204);

    const after = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/unread`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(after.body.byChannel[ch.body._id] ?? 0).toBe(0);
  });

  it('notifies a mentioned member', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const ch = await createChannel(owner, ws._id, { name: 'general', memberIds: [member.id] });
    await postMessage(owner, ch.body._id, { body: 'hey @you', mentions: [member.id] });

    const notifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${member.token}`);
    expect(notifs.body.items.some((n: { type: string }) => n.type === 'chat.mention')).toBe(true);
  });

  it('adds reactions and threaded replies', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general' });
    const root = await postMessage(owner, ch.body._id, { body: 'root message' });

    const react = await request(app)
      .post(`/api/chat/messages/${root.body._id}/react`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ emoji: '👍' });
    expect(react.body.reactions[0].userIds).toContain(owner.id);

    const reply = await postMessage(owner, ch.body._id, {
      body: 'a reply',
      parentId: root.body._id,
    });
    expect(reply.status).toBe(201);

    const replies = await request(app)
      .get(`/api/chat/messages/${root.body._id}/replies`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(replies.body.items).toHaveLength(1);

    // The reply should not appear in the top-level message list.
    const top = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(top.body.items).toHaveLength(1);
    expect(top.body.items[0].replyCount).toBe(1);
  });

  it('lists every thread the user participates in', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);
    const outsider = await makeUser(app);
    await addMember(owner, ws._id, outsider);

    const ch = await createChannel(owner, ws._id, { name: 'general', isPrivate: false });
    const root = await postMessage(owner, ch.body._id, { body: 'root message' });

    const threadsUrl = `/api/chat/workspaces/${ws._id}/threads`;

    // A root with no replies is not a thread yet.
    const before = await request(app)
      .get(threadsUrl)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(before.body.items).toHaveLength(0);

    // The member replies (auto-joins the public channel), making it a thread.
    await postMessage(member, ch.body._id, { body: 'a reply', parentId: root.body._id });

    // The root author sees the thread, with channel + the thread's last messages.
    // With a single reply, the preview is the root + that reply (oldest-first).
    const ownerThreads = await request(app)
      .get(threadsUrl)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(ownerThreads.body.items).toHaveLength(1);
    expect(ownerThreads.body.items[0].root._id).toBe(root.body._id);
    expect(ownerThreads.body.items[0].root.replyCount).toBe(1);
    expect(ownerThreads.body.items[0].channel.name).toBe('general');
    expect(ownerThreads.body.items[0].lastMessages).toHaveLength(2);
    expect(ownerThreads.body.items[0].lastMessages[0].body).toBe('root message');
    expect(ownerThreads.body.items[0].lastMessages[1].body).toBe('a reply');

    // The replier participates too.
    const memberThreads = await request(app)
      .get(threadsUrl)
      .set('Authorization', `Bearer ${member.token}`);
    expect(memberThreads.body.items).toHaveLength(1);
    expect(memberThreads.body.items[0].root._id).toBe(root.body._id);

    // Someone who never touched the channel sees nothing.
    const outsiderThreads = await request(app)
      .get(threadsUrl)
      .set('Authorization', `Bearer ${outsider.token}`);
    expect(outsiderThreads.body.items).toHaveLength(0);
  });

  it('previews the two most recent messages of a thread', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general' });
    const root = await postMessage(owner, ch.body._id, { body: 'the original' });
    for (const body of ['reply one', 'reply two', 'reply three']) {
      await postMessage(owner, ch.body._id, { body, parentId: root.body._id });
    }

    const res = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/threads`)
      .set('Authorization', `Bearer ${owner.token}`);
    const item = res.body.items[0];
    // With 3 replies, the preview is the two newest replies (not the root), oldest-first.
    expect(item.root.replyCount).toBe(3);
    expect(item.lastMessages.map((m: { body: string }) => m.body)).toEqual([
      'reply two',
      'reply three',
    ]);
  });

  it('paginates threads by most recent activity', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general' });

    for (let i = 0; i < 3; i++) {
      const r = await postMessage(owner, ch.body._id, { body: `root ${i}` });
      await postMessage(owner, ch.body._id, { body: `reply ${i}`, parentId: r.body._id });
    }

    const threadsUrl = `/api/chat/workspaces/${ws._id}/threads`;
    const page1 = await request(app)
      .get(threadsUrl)
      .query({ limit: 2 })
      .set('Authorization', `Bearer ${owner.token}`);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await request(app)
      .get(threadsUrl)
      .query({ limit: 2, before: page1.body.nextCursor })
      .set('Authorization', `Bearer ${owner.token}`);
    expect(page2.body.items.length).toBeGreaterThanOrEqual(1);

    // Pages don't overlap.
    const ids1: string[] = page1.body.items.map((t: { root: { _id: string } }) => t.root._id);
    const ids2: string[] = page2.body.items.map((t: { root: { _id: string } }) => t.root._id);
    expect(ids2.some((id) => ids1.includes(id))).toBe(false);
  });

  it('returns recent messages per conversation for seeding, ascending with a cursor', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const ch = await createChannel(owner, ws._id, { name: 'general' });

    // Post more than one page so an older page (and thus a cursor) exists.
    for (let i = 0; i < 25; i++) {
      await postMessage(owner, ch.body._id, { body: `m${i}` });
    }

    const res = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/recent`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(res.status).toBe(200);

    const entry = res.body.items.find((e: { channelId: string }) => e.channelId === ch.body._id);
    expect(entry).toBeTruthy();
    // Caps at the recent window (20) and is ascending (oldest→newest).
    expect(entry.items).toHaveLength(20);
    expect(entry.items[0].body).toBe('m5');
    expect(entry.items[19].body).toBe('m24');
    // A cursor is present because older messages remain.
    expect(entry.nextCursor).toBeTruthy();

    // The cursor pages backwards through the same channel's message list.
    const older = await request(app)
      .get(`/api/chat/channels/${ch.body._id}/messages`)
      .query({ before: entry.nextCursor })
      .set('Authorization', `Bearer ${owner.token}`);
    expect(older.body.items.at(-1).body).toBe('m4');
  });

  it('only includes conversations the requesting user belongs to in recent', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    // A private channel the member is NOT in.
    const secret = await createChannel(owner, ws._id, { name: 'secret', isPrivate: true });
    await postMessage(owner, secret.body._id, { body: 'classified' });

    const res = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/recent`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.some((e: { channelId: string }) => e.channelId === secret.body._id)).toBe(
      false,
    );
  });

  it('scopes message search to channels the user belongs to', async () => {
    const owner = await makeUser(app);
    const ws = await makeWorkspace(app, owner);
    const member = await makeUser(app);
    await addMember(owner, ws._id, member);

    const secret = await createChannel(owner, ws._id, { name: 'secret', isPrivate: true });
    await postMessage(owner, secret.body._id, { body: 'classified pineapple' });

    const res = await request(app)
      .get(`/api/chat/workspaces/${ws._id}/search`)
      .query({ q: 'pineapple' })
      .set('Authorization', `Bearer ${member.token}`);
    expect(res.body.items).toHaveLength(0);
  });
});
