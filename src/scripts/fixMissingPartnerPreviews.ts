import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { uploadPreviewVideo } from "../common/utils/googleDrive";

const VIDEOS_DIR = "C:\\Users\\ASD\\Downloads\\15 videos - Compressed";

function videoFileForIndex(i: number): string {
  const seq = (i % 15) + 1;
  return `trim Sequence ${String(seq).padStart(2, "0")}.mp4`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const partners = await Partner.find({ previewUrl: { $exists: false } });
  console.log(`Found ${partners.length} partner(s) without previewUrl`);

  for (let i = 0; i < partners.length; i++) {
    const partner = partners[i];
    const videoFile = videoFileForIndex(i);
    const videoPath = path.join(VIDEOS_DIR, videoFile);

    console.log(`Uploading ${videoFile} -> ${partner.name} (${partner._id}) ...`);
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
