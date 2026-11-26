import "dotenv/config";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";

const ASSET_COUNT = 3;
const DUMMY_GIRL_IMAGE_COUNT = 20;

function pickRandomAssets(count: number): string[] {
  const pool = Array.from({ length: DUMMY_GIRL_IMAGE_COUNT }, (_, i) => `/uploads/partners/dummy-girl-${i + 1}.jpg`);
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const partners = await Partner.find();
  for (const partner of partners) {
    partner.assets = pickRandomAssets(ASSET_COUNT);
    await partner.save();
    console.log(`${partner.name} (${partner._id}) -> ${partner.assets.join(", ")}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
