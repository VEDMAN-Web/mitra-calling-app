import "dotenv/config";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";

const DUMMY_GIRL_IMAGE_COUNT = 20;
const ASSET_COUNT = 3;

function randomDummyGirlImage(): string {
  const n = Math.floor(Math.random() * DUMMY_GIRL_IMAGE_COUNT) + 1;
  return `/uploads/partners/dummy-girl-${n}.jpg`;
}

function pickRandomAssets(count: number): string[] {
  const pool = Array.from({ length: DUMMY_GIRL_IMAGE_COUNT }, (_, i) => `/uploads/partners/dummy-girl-${i + 1}.jpg`);
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function randomAge(): number {
  return 21 + Math.floor(Math.random() * 10);
}

// Partners whose selfieImageUrl/avatarUrl are leftover test uploads instead of a girl image.
const EXISTING_IDS_TO_FIX = [
  "6b03d8ef4433ef0e74e71ca6", // Riya (older one)
  "6b06a71fcd1c934bf3940c19", // Fresh Partner
  "6b06a756ce6425c7d95e0fcf", // Fresh Partner 2
  "6b06a81a9ac189ee49abf735", // Final Partner
];

const NEW_PARTNER_NAMES = [
  "Ananya",
  "Ishita",
  "Kritika",
  "Ritika",
  "Shreya",
  "Aditi",
  "Divya",
  "Nidhi",
  "Pallavi",
  "Radhika",
  "Swati",
  "Tanvi",
  "Urvashi",
  "Vani",
  "Yamini",
  "Jhanvi",
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  console.log("Fixing existing partners' images...");
  for (const id of EXISTING_IDS_TO_FIX) {
    const partner = await Partner.findById(id);
    if (!partner) {
      console.warn(`  SKIP: ${id} not found`);
      continue;
    }
    const image = randomDummyGirlImage();
    partner.avatarUrl = image;
    partner.selfieImageUrl = image;
    await partner.save();
    console.log(`  ${partner.name} (${id}) -> ${image}`);
  }

  console.log("\nCreating 16 new partners...");
  const lastPhoneDoc = await Partner.findOne({ phone: /^9000000\d{3}$/ }).sort({ phone: -1 });
  let nextPhoneNumber = lastPhoneDoc ? parseInt(lastPhoneDoc.phone!, 10) + 1 : 9000000021;

  for (const name of NEW_PARTNER_NAMES) {
    const image = randomDummyGirlImage();
    const partner = await Partner.create({
      isGuest: false,
      phone: String(nextPhoneNumber++),
      name,
      age: randomAge(),
      languages: ["English", "Hindi"],
      bio: `Hi, I'm ${name}! Let's chat 😊`,
      avatarUrl: image,
      selfieImageUrl: image,
      assets: pickRandomAssets(ASSET_COUNT),
      verificationStatus: "approved",
    });
    console.log(`  ${partner.name} (${partner._id}) -> ${image}`);
  }

  console.log("\nAssigning isVip across all partners (20 true / 20 false)...");
  const all = await Partner.find().sort({ _id: 1 });
  console.log(`  total partners: ${all.length}`);
  for (let i = 0; i < all.length; i++) {
    all[i].isVip = i % 2 === 0;
    await all[i].save();
  }
  const vipCount = all.filter((p) => p.isVip).length;
  console.log(`  isVip=true: ${vipCount}, isVip=false: ${all.length - vipCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
