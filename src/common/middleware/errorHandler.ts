import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
}
