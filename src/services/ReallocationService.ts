import { prisma } from "../config/database";
import { TokenStatus } from "@prisma/client";

export class ReallocationService {

  /**
   * Handle capacity release when a token is cancelled or marked no-show
   */
  async handleCapacityRelease(slotId: string) {
    const activeTokens = await prisma.token.findMany({
      where: {
        slotId,
        status: TokenStatus.ACTIVE,
      },
      orderBy: { sequenceNumber: "asc" },
    });

    // We intentionally DO NOT auto-promote displaced tokens.
    // Hospitals require explicit action for fairness & auditability.
    return activeTokens;
  }

  /**
   * Mark a slot as delayed without mutating queue order
   */
  async markSlotDelayed(slotId: string, delayMinutes: number) {
    return prisma.slot.update({
      where: { id: slotId },
      data: { delayMinutes },
    });
  }

  /**
   * Complete a slot and close all active tokens
   */
  async completeSlot(slotId: string) {
    await prisma.token.updateMany({
      where: {
        slotId,
        status: TokenStatus.ACTIVE,
      },
      data: { status: TokenStatus.COMPLETED },
    });

    return prisma.slot.update({
      where: { id: slotId },
      data: { status: "COMPLETED" },
    });
  }
}
