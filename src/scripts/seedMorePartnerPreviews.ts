import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { uploadPreviewVideo, deleteDriveFile, extractDriveFileId } from "../utils/googleDrive";

const VIDEOS_DIR = "C:\\Users\\ASD\\Downloads\\15 videos - Compressed";

// The previous run matched "Riya" by name and hit the wrong partner (there are two).
const WRONGLY_SET_PARTNER_ID = "6b03d8ef4433ef0e74e71ca6";

const PARTNER_IDS_IN_ORDER = [
  "6b051720a391c23dc96bfa16", // Aanya
  "6b051720a391c23dc96bfa17", // Riya (correct one)
  "6b051720a391c23dc96bfa26", // Zoya
  "6b051720a391c23dc96bfa27", // Alisha
  "6b051720a391c23dc96bfa28", // Nisha
  "6b051720a391c23dc96bfa29", // Trisha
  "6b06a71fcd1c934bf3940c19", // Fresh Partner
  "6b06a756ce6425c7d95e0fcf", // Fresh Partner 2
  "6b06a81a9ac189ee49abf735", // Final Partner
];

function videoFileForIndex(i: number): string {
  const seq = (i % 15) + 1;
  return `trim Sequence ${String(seq).padStart(2, "0")}.mp4`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const wrongPartner = await Partner.findById(WRONGLY_SET_PARTNER_ID).select("previewUrl");
  if (wrongPartner?.previewUrl) {
    const fileId = extractDriveFileId(wrongPartner.previewUrl);
    console.log(`Clearing wrongly-set previewUrl on ${WRONGLY_SET_PARTNER_ID} ...`);
    if (fileId) await deleteDriveFile(fileId).catch((err) => console.warn("  drive delete failed:", err.message));
    wrongPartner.previewUrl = undefined;
    await wrongPartner.save();
    console.log("  cleared");
  }

  for (let i = 0; i < PARTNER_IDS_IN_ORDER.length; i++) {
    const partnerId = PARTNER_IDS_IN_ORDER[i];
    const videoFile = videoFileForIndex(i);
    const videoPath = path.join(VIDEOS_DIR, videoFile);

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      console.warn(`SKIP: partner ${partnerId} not found`);
      continue;
    }

    console.log(`Uploading ${videoFile} -> ${partner.name} (${partnerId}) ...`);
    const previewUrl = await uploadPreviewVideo(videoPath, videoFile, "video/mp4", String(partner._id));
    partner.previewUrl = previewUrl;
    await partner.save();
    console.log(`  done: ${previewUrl}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
