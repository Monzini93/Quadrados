import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    create: { username: "admin", passwordHash: hash },
    update: { passwordHash: hash },
  });

  await prisma.shopSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      adminWhatsAppDigits: "5511999999999",
      slotIntervalMinutes: 30,
    },
    update: {},
  });

  const defaultWeek: { weekday: number; isOpen: boolean; openMinute: number; closeMinute: number }[] = [
    { weekday: 0, isOpen: false, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 1, isOpen: true, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 2, isOpen: true, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 3, isOpen: true, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 4, isOpen: true, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 5, isOpen: true, openMinute: 9 * 60, closeMinute: 20 * 60 },
    { weekday: 6, isOpen: true, openMinute: 9 * 60, closeMinute: 18 * 60 },
  ];

  for (const w of defaultWeek) {
    await prisma.weekdaySchedule.upsert({
      where: { weekday: w.weekday },
      create: w,
      update: {
        isOpen: w.isOpen,
        openMinute: w.openMinute,
        closeMinute: w.closeMinute,
      },
    });
  }

  const services = [
    {
      name: "Corte",
      description: "Corte clássico ou moderno, acabamento com máquina e tesoura.",
      priceCents: 4500,
      durationMin: 40,
      sortOrder: 0,
    },
    {
      name: "Barba",
      description: "Barba feita com toalha quente e finalização premium.",
      priceCents: 3500,
      durationMin: 30,
      sortOrder: 1,
    },
    {
      name: "Corte + Barba",
      description: "Combo completo para visual impecável.",
      priceCents: 7000,
      durationMin: 70,
      sortOrder: 2,
    },
    {
      name: "Sobrancelha",
      description: "Design e harmonização do olhar.",
      priceCents: 2000,
      durationMin: 15,
      sortOrder: 3,
    },
    {
      name: "Pezinho / acabamento",
      description: "Retoque nas laterais e nuca.",
      priceCents: 1500,
      durationMin: 15,
      sortOrder: 4,
    },
  ];

  const existing = await prisma.service.count();
  if (existing === 0) {
    await prisma.service.createMany({ data: services });
  }

  console.log("Seed OK. Admin: admin /", password);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
