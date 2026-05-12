import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSlotStillAvailable } from "@/lib/availability";
import { buildBookingWhatsAppText, waMeUrl } from "@/lib/whatsapp";
import { formatDateBR, formatHHmm, parseDateOnly } from "@/lib/time";

const bodySchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(8).max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMinute: z.number().int().min(0).max(24 * 60),
  serviceIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { customerName, customerPhone, date, startMinute, serviceIds } = parsed.data;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await assertSlotStillAvailable(tx, { dateIso: date, serviceIds, startMinute });
      if (!slot) {
        throw new Error("SLOT_TAKEN");
      }

      const overlap = await tx.booking.count({
        where: {
          date: parseDateOnly(date),
          status: "CONFIRMED",
          AND: [{ startMinute: { lt: slot.endMinute } }, { endMinute: { gt: startMinute } }],
        },
      });
      if (overlap > 0) {
        throw new Error("SLOT_TAKEN");
      }

      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, active: true },
      });
      if (services.length !== serviceIds.length) {
        throw new Error("BAD_SERVICE");
      }

      const b = await tx.booking.create({
        data: {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          date: parseDateOnly(date),
          startMinute,
          endMinute: slot.endMinute,
          status: "CONFIRMED",
          services: {
            create: serviceIds.map((id) => ({ serviceId: id })),
          },
        },
        include: { services: { include: { service: true } } },
      });
      return b;
    });

    const settings = await prisma.shopSettings.findUnique({ where: { id: "main" } });
    const digits = settings?.adminWhatsAppDigits ?? "";
    const serviceNames = booking.services.map((s) => s.service.name);
    const msg = buildBookingWhatsAppText({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      serviceNames,
      dateLabel: formatDateBR(booking.date),
      timeLabel: formatHHmm(booking.startMinute),
    });
    const whatsappUrl = waMeUrl(digits, msg);

    return NextResponse.json({
      id: booking.id,
      whatsappUrl,
      message: "Agendamento confirmado.",
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "SLOT_TAKEN") {
        return NextResponse.json(
          { error: "Este horário acabou de ser reservado. Escolha outro horário." },
          { status: 409 }
        );
      }
      if (e.message === "BAD_SERVICE") {
        return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
      }
    }
    console.error(e);
    return NextResponse.json({ error: "Erro ao salvar agendamento." }, { status: 500 });
  }
}
