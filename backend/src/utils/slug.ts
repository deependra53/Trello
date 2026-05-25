import crypto from 'node:crypto';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function uniqueSlug(base: string): string {
  const slug = slugify(base) || 'workspace';
  return `${slug}-${crypto.randomBytes(3).toString('hex')}`;
}
