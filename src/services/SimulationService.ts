import { PrismaClient, TokenPriority, TokenSource } from "@prisma/client";
import { TokenAllocationService } from "./TokenAllocationService";
import { TokenStatus } from "@prisma/client";



const prisma = new PrismaClient();
const allocator = new TokenAllocationService();

export class SimulationService {

  async runFullDay() {
    const log: any[] = [];

    // Create Doctors
    const doctors = await prisma.doctor.createMany({
      data: [
        { name: "Dr. A", specialization: "General" },
        { name: "Dr. B", specialization: "Ortho" },
        { name: "Dr. C", specialization: "Pediatrics" }
      ]
    });

    log.push("Doctors created");

    const allDoctors = await prisma.doctor.findMany();

    // Create Slots
    const slots = [];
    for (const doc of allDoctors) {
      const slot = await prisma.slot.create({
        data: {
          doctorId: doc.id,
          startTime: new Date("2026-01-30T09:00:00Z"),
          endTime: new Date("2026-01-30T10:00:00Z"),
          capacity: 3
        }
      });
      slots.push(slot);
    }

    log.push("Slots created");

    // Create Patients
    const patients = [];
    for (let i = 1; i <= 10; i++) {
      patients.push(
        await prisma.patient.upsert({
          where: { phone: `99999999${i}` },
          update: {},
          create: {
            name: `Patient ${i}`,
            phone: `99999999${i}`,
          },
        })
      );

    }

    log.push("Patients created");

    // Allocate tokens
    await allocator.allocateToken({
      slotId: slots[0].id,
      doctorId: slots[0].doctorId,
      patientId: patients[0].id,
      priority: TokenPriority.FOLLOW_UP,
      source: TokenSource.WALK_IN
    });

    await allocator.allocateToken({
      slotId: slots[0].id,
      doctorId: slots[0].doctorId,
      patientId: patients[1].id,
      priority: TokenPriority.FOLLOW_UP,
      source: TokenSource.WALK_IN
      
    });

    await allocator.allocateToken({
      slotId: slots[0].id,
      doctorId: slots[0].doctorId,
      patientId: patients[2].id,
      priority: TokenPriority.PAID,
      source: TokenSource.ONLINE,
    });


    log.push("Initial tokens allocated");

    // Emergency arrives
    await allocator.allocateToken({
      slotId: slots[0].id,
      doctorId: slots[0].doctorId,
      patientId: patients[3].id,
      priority: TokenPriority.EMERGENCY,
      source: TokenSource.STAFF,
    });


    log.push("Emergency token inserted (displacement occurred)");

    // Cancellation
    const tokenToCancel = await prisma.token.findFirst({
      where: { status: TokenStatus.ACTIVE }
    });

    if (tokenToCancel) {
      await prisma.token.update({
        where: { id: tokenToCancel.id },
        data: { status: TokenStatus.CANCELLED }
      });
      log.push(`Token ${tokenToCancel.id} cancelled`);
    }

    // No-show
    const tokenNoShow = await prisma.token.findFirst({
      where: { status: TokenStatus.ACTIVE }

    });

    if (tokenNoShow) {
      await prisma.token.update({
        where: { id: tokenNoShow.id },
        data: { status: TokenStatus.NO_SHOW }
      });
      log.push(`Token ${tokenNoShow.id} marked NO_SHOW`);
    }

    return {
      message: "OPD Day Simulation Completed",
      log,
      finalQueues: await prisma.token.findMany({
        where: { status: TokenStatus.ACTIVE },
        orderBy: [
          { priority: "desc" },
          { sequenceNumber: "asc" }
        ]
      })
    };
  }
}


