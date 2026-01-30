import { prisma } from "../config/database";

export class SlotRepository {
  findById(id: string) {
    return prisma.slot.findUnique({ where: { id } });
  }
}
