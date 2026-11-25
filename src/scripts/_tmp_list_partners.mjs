import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/mitra_calling_app";
await mongoose.connect(uri);
const partners = await mongoose.connection.db.collection("partners").find({}, { projection: { name: 1, verificationStatus: 1, previewUrl: 1 } }).toArray();
console.log(JSON.stringify(partners, null, 2));
console.log("TOTAL:", partners.length);
await mongoose.disconnect();
