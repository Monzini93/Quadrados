"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBRLFromCents, onlyDigits } from "@/lib/format";
import { Calendar, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Svc = { id: string; name: string; description: string; priceCents: number; durationMin: number };

type AvailOk = {
  ok: true;
  slots: { minute: number; label: string }[];
  totalDurationMin: number;
  totalPriceCents: number;
};

type AvailClosed = {
  ok: false;
  reason: string;
  message: string;
};

type Avail = AvailOk | AvailClosed;

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function BookingFlow({ services }: { services: Svc[] }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avail, setAvail] = useState<Avail | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setStartMinute(null);
    setAvail(null);
  };

  const totalPreview = useMemo(() => {
    const list = services.filter((s) => selected.includes(s.id));
    const price = list.reduce((a, s) => a + s.priceCents, 0);
    const dur = list.reduce((a, s) => a + s.durationMin, 0);
    return { price, dur, list };
  }, [selected, services]);

  const loadAvail = useCallback(async (d: string, ids: string[]) => {
    setLoadingAvail(true);
    setError(null);
    try {
      const q = new URLSearchParams({ date: d, serviceIds: ids.join(",") });
      const res = await fetch(`/api/availability?${q}`);
      const data = (await res.json()) as Avail;
      setAvail(data);
    } catch {
      setAvail({ ok: false, reason: "network", message: "Erro ao carregar horários." });
    } finally {
      setLoadingAvail(false);
    }
  }, []);

  const goDateStep = () => {
    if (!selected.length) return;
    setStep(1);
    setStartMinute(null);
    setDateStr(null);
    setAvail(null);
  };

  const pickDate = (d: string) => {
    setDateStr(d);
    setStartMinute(null);
    void loadAvail(d, selected);
  };

  const goTimeStep = () => {
    if (!dateStr || !avail?.ok) return;
    setStep(2);
  };

  const goFormStep = () => {
    if (startMinute == null) return;
    setStep(3);
  };

  const submit = async () => {
    if (!dateStr || startMinute == null || !selected.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          date: dateStr,
          startMinute,
          serviceIds: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir.");
        return;
      }
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl as string, "_blank", "noopener,noreferrer");
      }
      setStep(4);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = startOfDay(new Date());

  const calendarCells = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; ymd: string | null; disabled: boolean }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, ymd: null, disabled: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m, d);
      const ymd = toYMD(dt);
      const disabled = startOfDay(dt) < today;
      cells.push({ day: d, ymd, disabled });
    }
    return cells;
  }, [monthCursor, today]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex gap-2 text-xs font-medium text-zinc-500">
        {["Serviços", "Data", "Horário", "Dados"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                i <= step ? "border-amber-500 bg-amber-500/15 text-amber-400" : "border-zinc-700 text-zinc-600"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
            {i < 3 && <span className="hidden h-px flex-1 bg-zinc-800 sm:block" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="s0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`glass rounded-2xl p-5 text-left transition ${
                      on ? "border-amber-500/60 ring-2 ring-amber-500/30" : "hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <h3 className="font-semibold text-white">{s.name}</h3>
                      <span className="shrink-0 text-amber-400">{formatBRLFromCents(s.priceCents)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{s.description}</p>
                    <p className="mt-3 text-xs text-zinc-600">{s.durationMin} min</p>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
                <span className="text-zinc-400">
                  Total: <strong className="text-white">{totalPreview.dur} min</strong>
                </span>
                <span className="text-amber-400">{formatBRLFromCents(totalPreview.price)}</span>
              </div>
            )}
            <button
              type="button"
              disabled={!selected.length}
              onClick={goDateStep}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="text-sm font-semibold capitalize text-white">
                  {MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                </p>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {WEEKDAYS.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((c, idx) =>
                  c.day == null ? (
                    <div key={`e-${idx}`} />
                  ) : (
                    <button
                      type="button"
                      key={c.ymd!}
                      disabled={c.disabled}
                      onClick={() => !c.disabled && c.ymd && pickDate(c.ymd)}
                      className={`aspect-square rounded-lg text-sm font-medium transition ${
                        c.disabled
                          ? "cursor-not-allowed text-zinc-700"
                          : dateStr === c.ymd
                            ? "bg-amber-500 text-zinc-950"
                            : "text-zinc-200 hover:bg-zinc-800"
                      }`}
                    >
                      {c.day}
                    </button>
                  )
                )}
              </div>
            </div>

            {dateStr && (
              <div className="space-y-2">
                {loadingAvail && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários…
                  </div>
                )}
                {!loadingAvail && avail && !avail.ok && (
                  <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                    {avail.message}
                  </div>
                )}
                {!loadingAvail && avail?.ok && avail.slots.length === 0 && (
                  <p className="text-sm text-zinc-500">Não há horários livres neste dia para a duração selecionada.</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!dateStr || !avail?.ok || avail.slots.length === 0}
                onClick={goTimeStep}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
              >
                Horários
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && avail?.ok && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <p className="text-sm text-zinc-500">
              Horários disponíveis em <span className="text-amber-400">{dateStr}</span> — duração total{" "}
              {avail.totalDurationMin} min.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {avail.slots.map((sl) => (
                <button
                  type="button"
                  key={sl.minute}
                  onClick={() => setStartMinute(sl.minute)}
                  className={`rounded-xl border py-3 text-sm font-medium transition ${
                    startMinute === sl.minute
                      ? "border-amber-500 bg-amber-500/15 text-amber-300"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:border-zinc-600"
                  }`}
                >
                  {sl.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={startMinute == null}
                onClick={goFormStep}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass space-y-4 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 text-amber-500">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Seus dados</span>
            </div>
            <label className="block text-sm text-zinc-400">
              Nome completo
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none ring-amber-500/0 transition focus:border-amber-500/50 focus:ring-2"
                placeholder="Como devemos te chamar"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              WhatsApp / telefone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500/50 focus:ring-2"
                placeholder="(11) 99999-9999"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={submitting || name.trim().length < 2 || onlyDigits(phone).length < 10}
                onClick={() => void submit()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="s4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Agendamento registrado</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Abrimos o WhatsApp com a mensagem para a barbearia. Se não abriu, verifique o bloqueador de pop-ups.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setSelected([]);
                setDateStr(null);
                setStartMinute(null);
                setName("");
                setPhone("");
                setAvail(null);
                setError(null);
              }}
              className="mt-8 rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Novo agendamento
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
