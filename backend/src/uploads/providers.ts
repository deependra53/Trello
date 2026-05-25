import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface StoredFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadProvider {
  store(opts: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

// ---- Local disk provider ----------------------------------------------------

const LOCAL_ROOT = path.resolve('uploads');

class LocalProvider implements UploadProvider {
  async store(opts: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<StoredFile> {
    const ext = path.extname(opts.originalName) || '';
    const safeFolder = opts.folder.replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${safeFolder}/${crypto.randomBytes(12).toString('hex')}${ext}`;
    const dest = path.join(LOCAL_ROOT, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, opts.buffer);
    return {
      url: `/uploads/${key}`,
      key,
      size: opts.buffer.byteLength,
      mimeType: opts.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(LOCAL_ROOT, key));
    } catch {
      // ignore
    }
  }
}

// ---- Cloudinary / S3 (stubs) ------------------------------------------------

class CloudinaryProvider implements UploadProvider {
  async store(): Promise<StoredFile> {
    throw new Error(
      'Cloudinary provider not implemented — install `cloudinary` and wire credentials in env.',
    );
  }
  async delete(): Promise<void> {
    /* stub */
  }
}

class S3Provider implements UploadProvider {
  async store(): Promise<StoredFile> {
    throw new Error(
      'S3 provider not implemented — install `@aws-sdk/client-s3` and wire credentials in env.',
    );
  }
  async delete(): Promise<void> {
    /* stub */
  }
}

let provider: UploadProvider | null = null;

export function getUploadProvider(): UploadProvider {
  if (provider) return provider;
  switch (env.UPLOAD_PROVIDER) {
    case 'cloudinary':
      provider = new CloudinaryProvider();
      break;
    case 's3':
      provider = new S3Provider();
      break;
    default:
      provider = new LocalProvider();
  }
  return provider;
}

export const LOCAL_UPLOADS_DIR = LOCAL_ROOT;
