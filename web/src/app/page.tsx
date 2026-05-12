import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRLFromCents } from "@/lib/format";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  return (
    <div className="space-y-20">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber-500/90">Barbearia moderna</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Estilo e precisão em{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              cada detalhe
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Agende online em poucos passos — sem criar conta. Escolha serviços, dia e horário disponível com confirmação
            imediata.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
            >
              Agendar horário
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900/50"
            >
              Ver serviços
            </a>
          </div>
        </div>
        <div className="glass relative overflow-hidden rounded-3xl p-8">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-3 text-amber-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Experiência premium</span>
            </div>
            <ul className="space-y-4 text-zinc-300">
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500/80" />
                <span>Horários em tempo real — sem conflito de agenda.</span>
              </li>
              <li className="flex gap-3">
                <ScissorsIcon />
                <span>Confirmação com envio automático para o WhatsApp da barbearia.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="servicos" className="scroll-mt-24">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Serviços</h2>
            <p className="mt-1 text-zinc-500">Valores e durações orientativos — configuráveis no painel.</p>
          </div>
          <Link href="/agendar" className="text-sm font-medium text-amber-500 hover:text-amber-400">
            Ir para agendamento →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.id}
              className="group glass rounded-2xl p-6 transition hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <h3 className="text-lg font-semibold text-white">{s.name}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">{s.description || "—"}</p>
              <div className="mt-4 flex items-baseline justify-between border-t border-zinc-800/80 pt-4">
                <span className="text-2xl font-bold text-amber-400">{formatBRLFromCents(s.priceCents)}</span>
                <span className="text-sm text-zinc-500">{s.durationMin} min</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScissorsIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  );
}
