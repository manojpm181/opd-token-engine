import { PrismaClient, TokenPriority, TokenSource, TokenStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRIORITY_RANK: Record<TokenPriority, number> = {
  EMERGENCY: 3,
  PAID: 2,
  FOLLOW_UP: 1,
};

export class TokenAllocationService {

  async allocateToken(input: {
    slotId: string;
    doctorId: string;
    patientId: string;
    priority: TokenPriority;
    source: TokenSource;
  }) {
    return prisma.$transaction(async (tx) => {

      const slot = await tx.slot.findUnique({
        where: { id: input.slotId }
      });
      if (!slot || slot.status !== "SCHEDULED") {
        throw new Error("Slot unavailable");
      }

      const activeTokens = await tx.token.findMany({
        where: {
          slotId: input.slotId,
          status: TokenStatus.ACTIVE
        },
        orderBy: [
          { priority: "asc" }, // lowest first
          { sequenceNumber: "desc" }
        ]
      });

      const capacityReached = activeTokens.length >= slot.capacity;

      let displacedToken = null;

      if (capacityReached) {
        const lowest = activeTokens[0];

        const canDisplace =
          input.priority === TokenPriority.EMERGENCY ||
          PRIORITY_RANK[input.priority] > PRIORITY_RANK[lowest.priority];

        if (!canDisplace) {
          throw new Error("Slot full. Token rejected.");
        }

        displacedToken = lowest;

        await tx.token.update({
          where: { id: lowest.id },
          data: { status: TokenStatus.DISPLACED }
        });
      }

      const sequenceNumber =
        activeTokens.length > 0
          ? Math.max(...activeTokens.map(t => t.sequenceNumber)) + 1
          : 1;

      const newToken = await tx.token.create({
        data: {
          slotId: input.slotId,
          doctorId: input.doctorId,
          patientId: input.patientId,
          priority: input.priority,
          source: input.source,
          sequenceNumber
        }
      });

      await tx.auditLog.create({
        data: {
          tokenId: newToken.id,
          action: "TOKEN_ALLOCATED",
          metadata: {
            displacedTokenId: displacedToken?.id ?? null
          }
        }
      });

      return newToken;
    });
  }
}
