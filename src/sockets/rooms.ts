import { ActorRole } from "../utils/jwt";

export function room(role: ActorRole, id: string): string {
  return `${role}:${id}`;
}
