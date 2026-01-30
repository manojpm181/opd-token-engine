import { prisma } from "../config/database";

export class DoctorRepository {
  findAll() {
    return prisma.doctor.findMany();
  }
}
