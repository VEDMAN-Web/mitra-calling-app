import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { uploadPreviewVideo } from "../common/utils/googleDrive";

const VIDEOS_DIR = "C:\\Users\\ASD\\Downloads\\Sequence 01";

const VIDEO_FILES = [
  "Sequence 01.mp4",
  "Sequence 01_1.mp4",
  "Sequence 02.mp4",
  "Sequence 03_1.mp4",
  "Sequence 05_1.mp4",
  "Sequence 07_2.mp4",
  "Sequence 08_2.mp4",
  "Sequence 09_2.mp4",
  "Sequence 0141.mp4",
];

const VIDEOS_PER_PARTNER = 3;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const partners = await Partner.find().sort({ createdAt: 1 });
  console.log(`Found ${partners.length} partner(s)`);

  let fileCursor = 0;
  for (const partner of partners) {
    const videoUrls: string[] = [];

    for (let i = 0; i < VIDEOS_PER_PARTNER; i++) {
      const videoFile = VIDEO_FILES[fileCursor % VIDEO_FILES.length];
      fileCursor++;
      const videoPath = path.join(VIDEOS_DIR, videoFile);

      console.log(`Uploading ${videoFile} -> ${partner.name} (${partner._id}) ...`);
      const videoUrl = await uploadPreviewVideo(videoPath, videoFile, "video/mp4", String(partner._id));
      videoUrls.push(videoUrl);
      console.log(`  done: ${videoUrl}`);
    }

    partner.videos = videoUrls;
    await partner.save();
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
