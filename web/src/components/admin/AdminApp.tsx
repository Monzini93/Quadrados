"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { minutesToTimeValue, parseTimeValueToMinutes } from "@/lib/time";
import { formatBRLFromCents } from "@/lib/format";

const WD = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type WeekRow = { weekday: number; isOpen: boolean; openMinute: number; closeMinute: number };

type BookingRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: string;
  services: { service: { name: string } }[];
};

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
  active: boolean;
};

export function AdminApp() {
  const router = useRouter();
  const [tab, setTab] = useState<
    "bookings" | "weekdays" | "closures" | "blocks" | "special" | "services" | "settings"
  >("bookings");

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [weekdays, setWeekdays] = useState<WeekRow[]>([]);
  const [closures, setClosures] = useState<{ id: string; date: string }[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; date: string; startMinute: number; endMinute: number }[]>([]);
  const [specials, setSpecials] = useState<{ date: string; openMinute: number; closeMinute: number }[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [waDigits, setWaDigits] = useState("");
  const [intervalMin, setIntervalMin] = useState(30);

  const [closureDate, setClosureDate] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:00");
  const [spDate, setSpDate] = useState("");
  const [spOpen, setSpOpen] = useState("09:00");
  const [spClose, setSpClose] = useState("18:00");

  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDur, setSvcDur] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(null), 3500);
  };

  const loadBookings = useCallback(async () => {
    const r = await fetch("/api/admin/bookings");
    if (r.ok) setBookings(await r.json());
  }, []);

  const loadWeekdays = useCallback(async () => {
    const r = await fetch("/api/admin/weekdays");
    if (r.ok) setWeekdays(await r.json());
  }, []);

  const loadClosures = useCallback(async () => {
    const r = await fetch("/api/admin/closures");
    if (r.ok) setClosures(await r.json());
  }, []);

  const loadBlocks = useCallback(async () => {
    const r = await fetch("/api/admin/blocks");
    if (r.ok) setBlocks(await r.json());
  }, []);

  const loadSpecials = useCallback(async () => {
    const r = await fetch("/api/admin/special-days");
    if (r.ok) setSpecials(await r.json());
  }, []);

  const loadServices = useCallback(async () => {
    const r = await fetch("/api/admin/services");
    if (r.ok) setServices(await r.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const r = await fetch("/api/admin/settings");
    if (r.ok) {
      const d = await r.json();
      setWaDigits(d.adminWhatsAppDigits ?? "");
      setIntervalMin(d.slotIntervalMinutes ?? 30);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (tab === "weekdays") void loadWeekdays();
    if (tab === "closures") void loadClosures();
    if (tab === "blocks") void loadBlocks();
    if (tab === "special") void loadSpecials();
    if (tab === "services") void loadServices();
    if (tab === "settings") void loadSettings();
  }, [tab, loadWeekdays, loadClosures, loadBlocks, loadSpecials, loadServices, loadSettings]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function saveWeekdays() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/weekdays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: weekdays }),
      });
      if (!r.ok) throw new Error();
      flash("Horários da semana salvos.");
    } catch {
      flash("Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminWhatsAppDigits: waDigits,
          slotIntervalMinutes: intervalMin,
        }),
      });
      if (!r.ok) throw new Error();
      flash("Configurações salvas.");
    } catch {
      flash("Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  function setWeekdayField(i: number, patch: Partial<WeekRow>) {
    setWeekdays((prev) => prev.map((w) => (w.weekday === i ? { ...w, ...patch } : w)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Painel</h1>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-amber-400">{msg}</span>}
          <button
            type="button"
            onClick={() => void loadBookings()}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-900"
            title="Atualizar agendamentos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2 text-sm">
        {(
          [
            ["bookings", "Agendamentos"],
            ["weekdays", "Semana"],
            ["closures", "Fechamentos"],
            ["blocks", "Bloqueios"],
            ["special", "Dias especiais"],
            ["services", "Serviços"],
            ["settings", "WhatsApp / intervalo"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 font-medium transition ${
              tab === k ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Serviços</th>
                <th className="p-3">Data</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-zinc-800/80">
                  <td className="p-3">
                    <div className="font-medium text-white">{b.customerName}</div>
                    <div className="text-xs text-zinc-500">{b.customerPhone}</div>
                  </td>
                  <td className="p-3 text-zinc-400">{b.services.map((s) => s.service.name).join(", ")}</td>
                  <td className="p-3 text-zinc-300">
                    {b.date.slice(0, 10)} — {minutesToTimeValue(b.startMinute)}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        b.status === "CONFIRMED" ? "text-emerald-400" : b.status === "CANCELLED" ? "text-red-400" : ""
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {b.status === "CONFIRMED" && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:underline"
                        onClick={async () => {
                          if (!confirm("Cancelar este agendamento?")) return;
                          await fetch(`/api/admin/bookings/${b.id}/cancel`, { method: "PATCH" });
                          void loadBookings();
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="p-6 text-center text-sm text-zinc-500">Nenhum agendamento.</p>}
        </div>
      )}

      {tab === "weekdays" && (
        <div className="space-y-4">
          {weekdays
            .slice()
            .sort((a, b) => a.weekday - b.weekday)
            .map((w) => (
              <div key={w.weekday} className="glass flex flex-wrap items-end gap-4 rounded-xl p-4">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={w.isOpen}
                    onChange={(e) => setWeekdayField(w.weekday, { isOpen: e.target.checked })}
                  />
                  {WD[w.weekday]}
                </label>
                <label className="text-xs text-zinc-500">
                  Abre
                  <input
                    type="time"
                    disabled={!w.isOpen}
                    value={minutesToTimeValue(w.openMinute)}
                    onChange={(e) => {
                      try {
                        setWeekdayField(w.weekday, { openMinute: parseTimeValueToMinutes(e.target.value) });
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="mt-1 block rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-white disabled:opacity-40"
                  />
                </label>
                <label className="text-xs text-zinc-500">
                  Fecha
                  <input
                    type="time"
                    disabled={!w.isOpen}
                    value={minutesToTimeValue(w.closeMinute)}
                    onChange={(e) => {
                      try {
                        setWeekdayField(w.weekday, { closeMinute: parseTimeValueToMinutes(e.target.value) });
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="mt-1 block rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-white disabled:opacity-40"
                  />
                </label>
              </div>
            ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveWeekdays()}
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null} Salvar semana
          </button>
        </div>
      )}

      {tab === "closures" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <button
              type="button"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={async () => {
                if (!closureDate) return;
                const r = await fetch("/api/admin/closures", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: closureDate }),
                });
                if (r.ok) {
                  setClosureDate("");
                  void loadClosures();
                  flash("Data marcada como fechada.");
                } else flash("Erro (data duplicada?).");
              }}
            >
              Adicionar fechamento
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                <span>{c.date.slice(0, 10)}</span>
                <button
                  type="button"
                  className="text-red-400 hover:underline"
                  onClick={async () => {
                    await fetch(`/api/admin/closures?id=${c.id}`, { method: "DELETE" });
                    void loadClosures();
                  }}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "blocks" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-zinc-500">
              Data
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="mt-1 block rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Início
              <input
                type="time"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="mt-1 block rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Fim
              <input
                type="time"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="mt-1 block rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
              />
            </label>
            <button
              type="button"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={async () => {
                if (!blockDate) return;
                let sm: number;
                let em: number;
                try {
                  sm = parseTimeValueToMinutes(blockStart);
                  em = parseTimeValueToMinutes(blockEnd);
                } catch {
                  flash("Horários inválidos");
                  return;
                }
                const r = await fetch("/api/admin/blocks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: blockDate, startMinute: sm, endMinute: em }),
                });
                if (r.ok) {
                  void loadBlocks();
                  flash("Bloqueio criado.");
                } else flash("Erro.");
              }}
            >
              Bloquear intervalo
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                <span>
                  {b.date.slice(0, 10)} {minutesToTimeValue(b.startMinute)} – {minutesToTimeValue(b.endMinute)}
                </span>
                <button
                  type="button"
                  className="text-red-400 hover:underline"
                  onClick={async () => {
                    await fetch(`/api/admin/blocks?id=${b.id}`, { method: "DELETE" });
                    void loadBlocks();
                  }}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "special" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Sobrescreve o horário da semana apenas nesta data (ex.: feriado com expediente reduzido).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="date"
              value={spDate}
              onChange={(e) => setSpDate(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <input
              type="time"
              value={spOpen}
              onChange={(e) => setSpOpen(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <input
              type="time"
              value={spClose}
              onChange={(e) => setSpClose(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <button
              type="button"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={async () => {
                if (!spDate) return;
                let om: number;
                let cm: number;
                try {
                  om = parseTimeValueToMinutes(spOpen);
                  cm = parseTimeValueToMinutes(spClose);
                } catch {
                  flash("Horários inválidos");
                  return;
                }
                const r = await fetch("/api/admin/special-days", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: spDate, openMinute: om, closeMinute: cm }),
                });
                if (r.ok) {
                  void loadSpecials();
                  flash("Dia especial salvo.");
                } else flash("Erro.");
              }}
            >
              Salvar dia especial
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {specials.map((s) => (
              <li
                key={s.date}
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
              >
                <span>
                  {typeof s.date === "string" ? s.date.slice(0, 10) : (s.date as unknown as string).slice?.(0, 10) ?? ""}{" "}
                  {minutesToTimeValue(s.openMinute)} – {minutesToTimeValue(s.closeMinute)}
                </span>
                <button
                  type="button"
                  className="text-red-400 hover:underline"
                  onClick={async () => {
                    const d = typeof s.date === "string" ? s.date.slice(0, 10) : String(s.date).slice(0, 10);
                    await fetch(`/api/admin/special-days?date=${d}`, { method: "DELETE" });
                    void loadSpecials();
                  }}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-6">
          <div className="glass grid gap-3 rounded-xl p-4 sm:grid-cols-4">
            <input
              placeholder="Nome"
              value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white sm:col-span-2"
            />
            <input
              placeholder="Preço (R$)"
              type="number"
              step="0.01"
              value={svcPrice}
              onChange={(e) => setSvcPrice(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Minutos"
              type="number"
              value={svcDur}
              onChange={(e) => setSvcDur(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              className="sm:col-span-4 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
              onClick={async () => {
                const price = Math.round(parseFloat(svcPrice.replace(",", ".")) * 100);
                const dur = parseInt(svcDur, 10);
                if (!svcName || !price || !dur) {
                  flash("Preencha nome, preço e duração.");
                  return;
                }
                const r = await fetch("/api/admin/services", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: svcName, priceCents: price, durationMin: dur }),
                });
                if (r.ok) {
                  setSvcName("");
                  setSvcPrice("");
                  setSvcDur("");
                  void loadServices();
                  flash("Serviço criado.");
                } else flash("Erro.");
              }}
            >
              Adicionar serviço
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2">Preço</th>
                  <th className="p-2">Min</th>
                  <th className="p-2">Ativo</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-800">
                    <td className="p-2 text-white">{s.name}</td>
                    <td className="p-2 text-center text-amber-400">{formatBRLFromCents(s.priceCents)}</td>
                    <td className="p-2 text-center text-zinc-400">{s.durationMin}</td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={s.active}
                        onChange={async (e) => {
                          await fetch(`/api/admin/services/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ active: e.target.checked }),
                          });
                          void loadServices();
                        }}
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        className="text-red-400 hover:underline"
                        onClick={async () => {
                          if (!confirm("Excluir serviço?")) return;
                          const r = await fetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
                          if (r.ok) void loadServices();
                          else flash("Não foi possível excluir (pode existir agendamento).");
                        }}
                      >
                        excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="glass max-w-lg space-y-4 rounded-2xl p-6">
          <label className="block text-sm text-zinc-400">
            WhatsApp do administrador (apenas números, com DDI 55…)
            <input
              value={waDigits}
              onChange={(e) => setWaDigits(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              placeholder="5511999999999"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Intervalo entre horários exibidos (minutos)
            <input
              type="number"
              min={5}
              max={120}
              value={intervalMin}
              onChange={(e) => setIntervalMin(parseInt(e.target.value, 10) || 30)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            />
          </label>
          <p className="text-xs text-zinc-500">
            Ao confirmar um agendamento, o site abre o WhatsApp Web/App com a mensagem preenchida para este número.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveSettings()}
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
