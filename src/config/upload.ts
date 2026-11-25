import fs from "fs";
import path from "path";
import multer from "multer";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const PARTNER_DOCS_DIR = path.join(UPLOADS_ROOT, "partners");
const USER_IMAGES_DIR = path.join(UPLOADS_ROOT, "users");
export const PARTNER_PREVIEW_CLIPS_DIR = path.join(UPLOADS_ROOT, "partnerPreviewClips");

fs.mkdirSync(PARTNER_DOCS_DIR, { recursive: true });
fs.mkdirSync(USER_IMAGES_DIR, { recursive: true });
fs.mkdirSync(PARTNER_PREVIEW_CLIPS_DIR, { recursive: true });

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

export const uploadPartnerPreviewVideo = multer({
  storage: makeStorage(PARTNER_PREVIEW_CLIPS_DIR),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("previewVideo must be a video file"));
      return;
    }
    cb(null, true);
  },
});

export function uploadedFileUrl(filename: string): string {
  return `/uploads/partners/${filename}`;
}

export function uploadedUserFileUrl(filename: string): string {
  return `/uploads/users/${filename}`;
}

export function uploadedPreviewClipUrl(filename: string): string {
  return `/uploads/partnerPreviewClips/${filename}`;
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

export async function deletePartnerFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith("/uploads/partners/")) return;
  const filePath = path.join(PARTNER_DOCS_DIR, path.basename(fileUrl));
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
