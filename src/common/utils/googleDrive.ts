import fs from "fs";
import { google, drive_v3 } from "googleapis";
import { HttpError } from "./HttpError";

const ROOT_FOLDER_NAME = process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME || "Partner Previews";

let driveClient: drive_v3.Drive | null = null;

export function getDriveOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new HttpError(500, "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are not configured");
  }
  return new google.auth.OAuth2(clientId, clientSecret, "http://localhost");
}

function getDriveClient(): drive_v3.Drive {
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new HttpError(500, "GOOGLE_DRIVE_REFRESH_TOKEN is not configured");
  }
  if (!driveClient) {
    const oauth2Client = getDriveOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    driveClient = google.drive({ version: "v3", auth: oauth2Client });
  }
  return driveClient;
}

async function findFolder(client: drive_v3.Drive, name: string, parentId: string): Promise<string | null> {
  const res = await client.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(client: drive_v3.Drive, name: string, parentId: string): Promise<string> {
  const res = await client.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return res.data.id!;
}

async function getOrCreateFolder(client: drive_v3.Drive, name: string, parentId: string): Promise<string> {
  const existing = await findFolder(client, name, parentId);
  if (existing) return existing;
  return createFolder(client, name, parentId);
}

let rootFolderIdPromise: Promise<string> | null = null;

async function getRootFolderId(client: drive_v3.Drive): Promise<string> {
  if (!rootFolderIdPromise) {
    rootFolderIdPromise = getOrCreateFolder(client, ROOT_FOLDER_NAME, "root");
  }
  return rootFolderIdPromise;
}

async function getOrCreatePartnerFolder(client: drive_v3.Drive, partnerId: string): Promise<string> {
  const rootFolderId = await getRootFolderId(client);
  return getOrCreateFolder(client, partnerId, rootFolderId);
}

export async function uploadPreviewVideo(
  localFilePath: string,
  fileName: string,
  mimeType: string,
  partnerId: string
): Promise<string> {
  const client = getDriveClient();
  const folderId = await getOrCreatePartnerFolder(client, partnerId);

  const res = await client.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: fs.createReadStream(localFilePath) },
    fields: "id, webViewLink",
  });

  const fileId = res.data.id!;
  await client.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return res.data.webViewLink!;
}

export function extractDriveFileId(driveUrl: string): string | null {
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const client = getDriveClient();
  try {
    await client.files.delete({ fileId });
  } catch (err) {
    if ((err as { code?: number }).code !== 404) throw err;
  }
}
