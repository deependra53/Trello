import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

export interface StoredFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export interface UploadProvider {
  store(opts: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  /** Presign a direct upload from the browser. Returns null if the provider doesn't support it. */
  presignPut(opts: {
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<PresignedUpload | null>;
  /** Resolve a stored `key` (as saved on the attachment) back to a public URL. Returns null if N/A. */
  publicUrlForKey(key: string): string | null;
}

function buildObjectKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName) || '';
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeFolder}/${crypto.randomBytes(12).toString('hex')}${ext}`;
}

/**
 * Build a Content-Disposition header so downloads keep the ORIGINAL filename
 * (the object key is a random hash). Images use `inline` so they still render in
 * <img>/new tabs; other files use `attachment` to download. RFC 5987 `filename*`
 * carries the exact UTF-8 name, with an ASCII fallback for older clients.
 */
function contentDisposition(originalName: string, mimeType: string): string {
  const kind = mimeType.startsWith('image/') ? 'inline' : 'attachment';
  const asciiFallback = originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${kind}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(originalName)}`;
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
    const key = buildObjectKey(opts.folder, opts.originalName);
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

  async presignPut(): Promise<PresignedUpload | null> {
    return null; // local provider has no presign; client should POST multipart
  }

  publicUrlForKey(key: string): string | null {
    return `/uploads/${key}`;
  }
}

// ---- Cloudinary stub --------------------------------------------------------

class CloudinaryProvider implements UploadProvider {
  async store(): Promise<StoredFile> {
    throw new Error(
      'Cloudinary provider not implemented — install `cloudinary` and wire credentials in env.',
    );
  }
  async delete(): Promise<void> {
    /* stub */
  }
  async presignPut(): Promise<PresignedUpload | null> {
    return null;
  }
  publicUrlForKey(): string | null {
    return null;
  }
}

// ---- S3 provider ------------------------------------------------------------

class S3Provider implements UploadProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private presignExpiresSeconds = 60 * 5; // 5 min

  constructor() {
    if (!env.AWS_S3_BUCKET || !env.AWS_REGION) {
      throw new Error('S3 provider requires AWS_S3_BUCKET and AWS_REGION env vars.');
    }
    this.bucket = env.AWS_S3_BUCKET;
    this.region = env.AWS_REGION;
    this.client = new S3Client({
      region: this.region,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async store(opts: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<StoredFile> {
    const key = buildObjectKey(opts.folder, opts.originalName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: opts.buffer,
        ContentType: opts.mimeType,
        ContentDisposition: contentDisposition(opts.originalName, opts.mimeType),
      }),
    );
    return {
      url: this.publicUrl(key),
      key,
      size: opts.buffer.byteLength,
      mimeType: opts.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      // ignore — we never want a stuck attachment record because S3 deletion failed
    }
  }

  async presignPut(opts: {
    originalName: string;
    mimeType: string;
    folder: string;
  }): Promise<PresignedUpload> {
    const key = buildObjectKey(opts.folder, opts.originalName);
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: opts.mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client, cmd, {
      expiresIn: this.presignExpiresSeconds,
    });
    return {
      uploadUrl,
      publicUrl: this.publicUrl(key),
      key,
      expiresIn: this.presignExpiresSeconds,
    };
  }

  publicUrlForKey(key: string): string {
    return this.publicUrl(key);
  }

  private publicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
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
