import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set env vars BEFORE importing app modules
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh';
process.env.MONGODB_URI = 'mongodb://placeholder/test';
process.env.SMTP_HOST = '';
process.env.LOG_LEVEL = 'silent';
// Keep uploads hermetic — never hit real S3 from the test suite.
process.env.UPLOAD_PROVIDER = 'local';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
