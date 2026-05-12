import type { Prisma, PrismaClient } from "@prisma/client";
import { formatHHmm, parseDateOnly, weekdayUTC } from "./time";

export type SlotDto = { minute: number; label: string };

export type AvailabilityOk = {
  ok: true;
  slots: SlotDto[];
  totalDurationMin: number;
  totalPriceCents: number;
};

export type AvailabilityClosed = {
  ok: false;
  reason: string;
  message: string;
};

export type AvailabilityResult = AvailabilityOk | AvailabilityClosed;

type Db = PrismaClient | Prisma.TransactionClient;

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

export async function computeAvailability(
  prisma: Db,
  params: { dateIso: string; serviceIds: string[] }
): Promise<AvailabilityResult> {
  const { dateIso, serviceIds } = params;
  if (!serviceIds.length) {
    return { ok: false, reason: "no_services", message: "Selecione ao menos um serviço." };
  }

  let date: Date;
  try {
    date = parseDateOnly(dateIso);
  } catch {
    return { ok: false, reason: "invalid_date", message: "Data inválida." };
  }

  const closure = await prisma.dateClosure.findUnique({ where: { date } });
  if (closure) {
    return {
      ok: false,
      reason: "closed_day",
      message: "Barbearia fechada nesta data.",
    };
  }

  const weekday = weekdayUTC(date);
  const weekRow = await prisma.weekdaySchedule.findUnique({ where: { weekday } });
  if (!weekRow || !weekRow.isOpen) {
    return {
      ok: false,
      reason: "closed_day",
      message: "Barbearia fechada nesta data.",
    };
  }

  let openM = weekRow.openMinute;
  let closeM = weekRow.closeMinute;

  const special = await prisma.specialDayHours.findUnique({ where: { date } });
  if (special) {
    openM = special.openMinute;
    closeM = special.closeMinute;
  }

  if (openM >= closeM) {
    return {
      ok: false,
      reason: "closed_day",
      message: "Barbearia fechada nesta data.",
    };
  }

  const settings = await prisma.shopSettings.findUnique({ where: { id: "main" } });
  const interval = settings?.slotIntervalMinutes ?? 30;

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, active: true },
  });
  if (services.length !== serviceIds.length) {
    return { ok: false, reason: "no_services", message: "Serviço inválido ou indisponível." };
  }

  const totalDurationMin = services.reduce((a, s) => a + s.durationMin, 0);
  const totalPriceCents = services.reduce((a, s) => a + s.priceCents, 0);

  const bookings = await prisma.booking.findMany({
    where: { date, status: "CONFIRMED" },
    select: { startMinute: true, endMinute: true },
  });

  const blocks = await prisma.blockedRange.findMany({
    where: { date },
    select: { startMinute: true, endMinute: true },
  });

  const slots: SlotDto[] = [];

  for (let start = openM; start + totalDurationMin <= closeM; start += interval) {
    const end = start + totalDurationMin;

    let blocked = false;
    for (const b of blocks) {
      if (rangesOverlap(start, end, b.startMinute, b.endMinute)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    for (const bk of bookings) {
      if (rangesOverlap(start, end, bk.startMinute, bk.endMinute)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    slots.push({ minute: start, label: formatHHmm(start) });
  }

  return {
    ok: true,
    slots,
    totalDurationMin,
    totalPriceCents,
  };
}

export async function assertSlotStillAvailable(
  prisma: Db,
  params: { dateIso: string; serviceIds: string[]; startMinute: number }
): Promise<{ endMinute: number; totalPriceCents: number } | null> {
  const av = await computeAvailability(prisma, {
    dateIso: params.dateIso,
    serviceIds: params.serviceIds,
  });
  if (!av.ok) return null;
  const hit = av.slots.find((s) => s.minute === params.startMinute);
  if (!hit) return null;
  return {
    endMinute: params.startMinute + av.totalDurationMin,
    totalPriceCents: av.totalPriceCents,
  };
}
