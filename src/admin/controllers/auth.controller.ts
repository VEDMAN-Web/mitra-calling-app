import { Request, Response } from "express";
import { signToken } from "../../common/utils/jwt";
import { HttpError } from "../../common/utils/HttpError";

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
    throw new HttpError(401, "Invalid admin credentials");
  }

  const token = signToken(adminEmail, "admin");
  res.json({ token });
}
