import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider } from "./storage-provider";

export class R2StorageProvider implements StorageProvider {
  private client: S3Client | null = null;

  private getS3Client(): S3Client {
    if (this.client) return this.client;

    const accountId = process.env.R2_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("R2_ACCOUNT_ID environment variable is not set");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });

    return this.client;
  }

  private getBucketName(): string {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new Error("R2_BUCKET_NAME environment variable is not set");
    }
    return bucket;
  }

  async getUploadSignedUrl(key: string, contentType?: string): Promise<string> {
    const client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: this.getBucketName(),
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(client, command, { expiresIn: 300 });
  }

  async getReadSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const client = this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: this.getBucketName(),
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const client = this.getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: this.getBucketName(),
      Key: key,
    });

    await client.send(command);
  }

  getPublicUrl(key: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      return key;
    }
    return `${publicUrl}/${key}`;
  }
}
