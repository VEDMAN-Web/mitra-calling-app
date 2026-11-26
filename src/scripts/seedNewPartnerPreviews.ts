import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { uploadPreviewVideo } from "../utils/googleDrive";

const VIDEOS_DIR = "C:\\Users\\ASD\\Downloads\\15 videos - Compressed";

const NEW_PARTNER_IDS_IN_ORDER = [
  "6b07b426cb5ad4c978a9e803", // Ananya
  "6b07b426cb5ad4c978a9e804", // Ishita
  "6b07b426cb5ad4c978a9e805", // Kritika
  "6b07b426cb5ad4c978a9e806", // Ritika
  "6b07b426cb5ad4c978a9e807", // Shreya
  "6b07b426cb5ad4c978a9e808", // Aditi
  "6b07b426cb5ad4c978a9e809", // Divya
  "6b07b426cb5ad4c978a9e80a", // Nidhi
  "6b07b426cb5ad4c978a9e80b", // Pallavi
  "6b07b426cb5ad4c978a9e80c", // Radhika
  "6b07b426cb5ad4c978a9e80d", // Swati
  "6b07b426cb5ad4c978a9e80e", // Tanvi
  "6b07b426cb5ad4c978a9e80f", // Urvashi
  "6b07b426cb5ad4c978a9e810", // Vani
  "6b07b426cb5ad4c978a9e811", // Yamini
  "6b07b426cb5ad4c978a9e812", // Jhanvi
];

function videoFileForIndex(i: number): string {
  const seq = (i % 15) + 1;
  return `trim Sequence ${String(seq).padStart(2, "0")}.mp4`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  for (let i = 0; i < NEW_PARTNER_IDS_IN_ORDER.length; i++) {
    const partnerId = NEW_PARTNER_IDS_IN_ORDER[i];
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
