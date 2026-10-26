import { S3Client } from "@aws-sdk/client-s3";
import env from "@/env/env";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  // Recent SDK versions add a CRC32 checksum to every request by default. On a
  // pre-signed PUT the body isn't known at signing time, so the URL carried the
  // checksum of an empty body and R2 would reject any real photo against it.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export { r2 };
