import { prisma } from "../config/database";

export class TokenRepository {
  findActiveBySlot(slotId: string) {
    return prisma.token.findMany({
      where: { slotId, status: "ACTIVE" },
    });
  }
}
