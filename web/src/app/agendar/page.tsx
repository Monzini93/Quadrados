import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true, priceCents: true, durationMin: true },
  });
  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Agendar</h1>
      <p className="mt-2 text-zinc-500">Sem cadastro. Escolha serviços, data e horário livre.</p>
      <div className="mt-10">
        <BookingFlow services={services} />
      </div>
    </div>
  );
}
