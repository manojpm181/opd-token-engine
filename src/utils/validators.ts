import { z } from "zod";
import { TokenPriority } from "@prisma/client";

export const createDoctorSchema = z.object({
  name: z.string().min(2),
  specialization: z.string().optional()
});

export const createSlotSchema = z.object({
  doctorId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().positive()
});


export const createTokenSchema = z.object({
  slotId: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  priority: z.enum(["EMERGENCY", "PAID", "FOLLOW_UP"]),
  source: z.enum(["ONLINE", "WALK_IN", "STAFF", "APP"]),
});


