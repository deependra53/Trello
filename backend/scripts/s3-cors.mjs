// One-off: set + verify CORS on the uploads bucket so the browser can PUT directly.
import 'dotenv/config';
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';

const bucket = process.env.AWS_S3_BUCKET;
const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CORSRules = [
  {
    AllowedHeaders: ['*'],
    AllowedMethods: ['PUT', 'GET', 'HEAD'],
    AllowedOrigins: ['*'], // presigned URL is the real gate; tighten to your domains in prod
    ExposeHeaders: ['ETag'],
    MaxAgeSeconds: 3000,
  },
];

try {
  await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules } }));
  console.log('PUT CORS: ok');
  const got = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log('GET CORS:', JSON.stringify(got.CORSRules));
} catch (e) {
  console.log('CORS FAILED —', e.name, e.message);
}
