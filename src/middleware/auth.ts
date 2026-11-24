import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";
import { isTokenBlacklisted } from "../services/tokenBlacklist.service";

function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or invalid Authorization header");
  }
  return header.slice("Bearer ".length);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    const payload = verifyToken(token);
    if (await isTokenBlacklisted(token)) throw new Error("token blacklisted");
    req.token = token;
    req.actor = { id: payload.sub, role: payload.role };
    if (payload.role === "user") req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export async function requireUserAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    const payload = verifyToken(token);
    if (payload.role !== "user") throw new Error("wrong role");
    if (await isTokenBlacklisted(token)) throw new Error("token blacklisted");
    req.token = token;
    req.actor = { id: payload.sub, role: "user" };
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export async function requirePartnerAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    const payload = verifyToken(token);
    if (payload.role !== "partner") throw new Error("wrong role");
    if (await isTokenBlacklisted(token)) throw new Error("token blacklisted");
    req.token = token;
    req.actor = { id: payload.sub, role: "partner" };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const key = req.headers["x-admin-key"];
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    throw new HttpError(401, "Invalid admin key");
  }
  next();
}
