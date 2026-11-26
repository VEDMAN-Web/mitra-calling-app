import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";
import mongoose from "mongoose";
import { Partner } from "../models/Partner";
import { UPLOADS_ROOT } from "../config/upload";

const PARTNER_IMAGES_DIR = path.join(UPLOADS_ROOT, "partners");
const ASSET_COUNT = 3;
const SIZE_PATHS = ["", "med/", "thumb/"] as const;
const PEOPLE_PER_SIZE = 100;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCandidatePool(): { url: string; size: string; index: number }[] {
  const pool: { url: string; size: string; index: number }[] = [];
  for (const sizePath of SIZE_PATHS) {
    for (let i = 0; i < PEOPLE_PER_SIZE; i++) {
      const size = sizePath === "" ? "full" : sizePath.replace("/", "");
      pool.push({ url: `https://randomuser.me/api/portraits/${sizePath}women/${i}.jpg`, size, index: i });
    }
  }
  return shuffle(pool);
}

function download(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} -> ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  fs.mkdirSync(PARTNER_IMAGES_DIR, { recursive: true });

  const partners = await Partner.find().sort({ _id: 1 });
  const slotsNeeded = partners.length * (1 + ASSET_COUNT);

  const pool = buildCandidatePool();
  if (pool.length < slotsNeeded) {
    throw new Error(`Not enough unique candidate images: need ${slotsNeeded}, have ${pool.length}`);
  }

  for (const partner of partners) {
    const selfieCandidate = pool.pop()!;
    const assetCandidates = Array.from({ length: ASSET_COUNT }, () => pool.pop()!);

    const selfieFilename = `woman-${selfieCandidate.size}-${selfieCandidate.index}.jpg`;
    await download(selfieCandidate.url, path.join(PARTNER_IMAGES_DIR, selfieFilename));
    partner.selfieImageUrl = `/uploads/partners/${selfieFilename}`;

    const assetUrls: string[] = [];
    for (const candidate of assetCandidates) {
      const filename = `woman-${candidate.size}-${candidate.index}.jpg`;
      await download(candidate.url, path.join(PARTNER_IMAGES_DIR, filename));
      assetUrls.push(`/uploads/partners/${filename}`);
    }
    partner.assets = assetUrls;

    await partner.save();
    console.log(`${partner.name} (${partner._id}) -> selfie: ${selfieFilename}, assets: ${assetUrls.join(", ")}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
