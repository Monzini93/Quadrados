"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.replace("/admin");
      });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Falha no login");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErr("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-2">
      <div className="glass rounded-3xl p-8">
        <h1 className="text-center text-2xl font-bold text-white">Área administrativa</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">Quadrados — use as credenciais definidas no seed.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-zinc-400">
            Usuário
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Senha
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            />
          </label>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
