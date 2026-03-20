import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getR2(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

const BUCKET = process.env.R2_BUCKET_NAME || "clip-art-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

interface UploadOptions {
  contentType?: string;
  category?: string;
  cacheControl?: string;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  options: UploadOptions = {},
): Promise<string> {
  const {
    contentType = "image/png",
    category,
    cacheControl = "public, max-age=31536000, immutable",
  } = options;

  const metadata: Record<string, string> = {
    "uploaded-at": new Date().toISOString(),
  };
  if (category) metadata.category = category;

  await getR2().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    }),
  );

  return `${PUBLIC_URL}/${key}`;
}
