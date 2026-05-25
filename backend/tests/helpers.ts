import request from 'supertest';
import type { Express } from 'express';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  id: string;
  token: string;
}

let counter = 0;

export async function makeUser(app: Express, suffix = ''): Promise<TestUser> {
  counter++;
  const u = {
    email: `u${Date.now()}${counter}${suffix}@test.dev`,
    password: 'supersecret1',
    fullName: `User ${counter}`,
  };
  const res = await request(app).post('/api/auth/signup').send(u);
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...u, id: res.body.user.id ?? res.body.user._id, token: res.body.accessToken };
}

export async function makeWorkspace(app: Express, user: TestUser, name = 'WS') {
  const res = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ name });
  if (res.status !== 201) throw new Error(`workspace failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function makeBoard(app: Express, user: TestUser, workspaceId: string, title = 'B') {
  const res = await request(app)
    .post(`/api/workspaces/${workspaceId}/boards`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ title });
  if (res.status !== 201) throw new Error(`board failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function makeList(app: Express, user: TestUser, boardId: string, title = 'List') {
  const res = await request(app)
    .post(`/api/boards/${boardId}/lists`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ title });
  if (res.status !== 201) throw new Error(`list failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function makeCard(app: Express, user: TestUser, listId: string, title = 'Card') {
  const res = await request(app)
    .post(`/api/lists/${listId}/cards`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ title });
  if (res.status !== 201) throw new Error(`card failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export function authed(user: TestUser) {
  return (req: request.Test) => req.set('Authorization', `Bearer ${user.token}`);
}
