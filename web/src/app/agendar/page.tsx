import { loadActiveServicesForBooking } from "@/lib/load-services";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const result = await loadActiveServicesForBooking();
  const services = result.ok ? result.services : [];
  const dbError = result.ok ? null : result.message;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Agendar</h1>
      <p className="mt-2 text-zinc-500">Sem cadastro. Escolha serviços, data e horário livre.</p>
      <div className="mt-10">
        <BookingFlow services={services} dbError={dbError} />
      </div>
    </div>
  );
}
