import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or invalid Authorization header");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}
