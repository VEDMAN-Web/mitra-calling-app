import { ActorRole } from "../utils/jwt";

export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
      actor?: { id: string; role: ActorRole };
    }
  }
}
