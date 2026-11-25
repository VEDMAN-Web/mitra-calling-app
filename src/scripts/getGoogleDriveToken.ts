import "dotenv/config";
import http from "http";
import { URL } from "url";
import { getDriveOAuthClient } from "../utils/googleDrive";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

async function main() {
  const oauth2Client = getDriveOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    redirect_uri: REDIRECT_URI,
  });

  console.log("\nOpen this URL in your browser (log in with the Google account to store videos under) and approve access:\n");
  console.log(authUrl, "\n");

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, REDIRECT_URI);
      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      if (error) {
        res.end("Authorization failed. You can close this tab.");
        server.close();
        reject(new Error(error));
        return;
      }
      if (authCode) {
        res.end("Authorized. You can close this tab and return to the terminal.");
        server.close();
        resolve(authCode);
      }
    });
    server.listen(PORT, () => {
      console.log(`Waiting for authorization on ${REDIRECT_URI} ...`);
    });
  });

  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
  if (!tokens.refresh_token) {
    console.error(
      "\nNo refresh_token was returned. This usually means you've already authorized this app before.\n" +
        "Go to https://myaccount.google.com/permissions, remove access for this app, then run this script again.\n"
    );
    process.exit(1);
  }

  console.log("\nAdd this to your .env as GOOGLE_DRIVE_REFRESH_TOKEN:\n");
  console.log(tokens.refresh_token);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
