import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

// R2 yapılandırılmış mı?
export function isR2Configured(): boolean {
  return (
    accountId.length > 0 &&
    accessKeyId.length > 0 &&
    secretAccessKey.length > 0 &&
    R2_BUCKET.length > 0 &&
    R2_PUBLIC_URL.length > 0 &&
    accountId !== "your-account-id"
  );
}

let _r2: S3Client | null = null;
function getR2Client(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _r2;
}

export async function uploadToR2(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  if (!isR2Configured()) {
    // Yerel diske kaydet (geliştirme ortamı)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const fileName = key.split("/").pop()!;
    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/${fileName}`;
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    if (!isR2Configured()) {
      // Yerel dosyayı sil
      const fileName = key.split("/").pop()!;
      await unlink(path.join(process.cwd(), "public", "uploads", fileName));
      return;
    }
    await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {}
}

/** fileUrl'den key çıkart */
export function urlToKey(fileUrl: string): string {
  if (fileUrl.startsWith("/uploads/")) return fileUrl; // yerel
  return fileUrl.replace(`${R2_PUBLIC_URL}/`, "");
}
