import { prisma } from "@/lib/prisma";

export type ServiceCard = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
};

export type LoadServicesResult =
  | { ok: true; services: ServiceCard[] }
  | { ok: false; services: []; message: string };

/** Evita derrubar a página se o Postgres estiver inacessível (rede, URL, SSL, etc.). */
export async function loadActiveServicesForHome(): Promise<LoadServicesResult> {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    });
    return { ok: true, services };
  } catch (e) {
    console.error("[Quadrados] Falha ao carregar serviços:", e);
    return {
      ok: false,
      services: [],
      message:
        "Não foi possível conectar ao banco de dados. Confira o DATABASE_URL no arquivo .env (pasta web), se a internet permite saída para o Neon e se você já rodou: npx prisma migrate deploy && npm run db:seed. Em URLs da Neon, se der erro de SSL no Windows, tente remover o parâmetro channel_binding=require da string.",
    };
  }
}

export async function loadActiveServicesForBooking(): Promise<LoadServicesResult> {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, description: true, priceCents: true, durationMin: true },
    });
    return { ok: true, services };
  } catch (e) {
    console.error("[Quadrados] Falha ao carregar serviços:", e);
    return {
      ok: false,
      services: [],
      message:
        "Banco de dados indisponível. Verifique o DATABASE_URL no .env e rode npx prisma migrate deploy && npm run db:seed na pasta web.",
    };
  }
}
