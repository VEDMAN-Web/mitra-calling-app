import { RtcTokenBuilder, RtcRole } from "agora-token";

const APP_ID = process.env.AGORA_APP_ID || "";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";
const TOKEN_EXPIRE_SECONDS = 3600;

export function generateAgoraToken(channelName: string, uid: number): string {
  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    TOKEN_EXPIRE_SECONDS,
    TOKEN_EXPIRE_SECONDS
  );
}

export function uidFromId(id: string): number {
  return parseInt(id.slice(-8), 16);
}
