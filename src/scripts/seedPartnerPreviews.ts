import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { uploadPreviewVideo } from "../utils/googleDrive";

const VIDEOS_DIR = "C:\\Users\\ASD\\Downloads\\15 videos - Compressed";

const PARTNER_NAMES_IN_ORDER = [
  "Riya",
  "Simran",
  "Priya",
  "Kavya",
  "Isha",
  "Diya",
  "Meera",
  "Tara",
  "Sana",
  "Neha",
  "Pooja",
  "Anjali",
  "Sneha",
  "Kiran",
  "Rhea",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  for (let i = 0; i < PARTNER_NAMES_IN_ORDER.length; i++) {
    const name = PARTNER_NAMES_IN_ORDER[i];
    const videoFile = `trim Sequence ${String(i + 1).padStart(2, "0")}.mp4`;
    const videoPath = path.join(VIDEOS_DIR, videoFile);

    const partner = await Partner.findOne({ name });
    if (!partner) {
      console.warn(`SKIP: partner "${name}" not found`);
      continue;
    }

    console.log(`Uploading ${videoFile} -> ${name} (${partner._id}) ...`);
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
