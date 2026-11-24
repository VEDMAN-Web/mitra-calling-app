import fs from "fs";
import path from "path";
import multer from "multer";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const PARTNER_DOCS_DIR = path.join(UPLOADS_ROOT, "partners");
const USER_IMAGES_DIR = path.join(UPLOADS_ROOT, "users");

fs.mkdirSync(PARTNER_DOCS_DIR, { recursive: true });
fs.mkdirSync(USER_IMAGES_DIR, { recursive: true });

function makeStorage(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

export const uploadPartnerDocs = multer({
  storage: makeStorage(PARTNER_DOCS_DIR),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadUserImage = multer({
  storage: makeStorage(USER_IMAGES_DIR),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function uploadedFileUrl(filename: string): string {
  return `/uploads/partners/${filename}`;
}

export function uploadedUserFileUrl(filename: string): string {
  return `/uploads/users/${filename}`;
}

export async function deleteUserImage(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/users/")) return;
  const filePath = path.join(USER_IMAGES_DIR, path.basename(imageUrl));
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
