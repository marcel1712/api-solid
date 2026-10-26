import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import env from "@/env/env";

export interface DocumentStorage {
  /** Signed PUT bound to this exact type and size, so the upload can't swap either. */
  createUploadUrl(key: string, contentType: string, size: number): Promise<string>;
  /** Size of the stored object, or `null` when nothing was uploaded under the key. */
  sizeOf(key: string): Promise<number | null>;
  createDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

const UPLOAD_URL_EXPIRES_IN_SECONDS = 5 * 60;
const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 10 * 60;

export class R2DocumentStorage implements DocumentStorage {
  private bucket = env.R2_DOCUMENTS_BUCKET_NAME;

  async createUploadUrl(key: string, contentType: string, size: number) {
    return getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      {
        expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
        // Without this the SDK leaves both out of the signature, and R2
        // would accept any type and any size under the URL.
        signableHeaders: new Set(["content-type", "content-length"]),
      },
    );
  }

  async sizeOf(key: string) {
    try {
      const head = await r2.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return head.ContentLength ?? 0;
    } catch (error) {
      if (error instanceof NotFound) {
        return null;
      }
      throw error;
    }
  }

  async createDownloadUrl(key: string) {
    return getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS },
    );
  }

  async delete(key: string) {
    await r2.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
