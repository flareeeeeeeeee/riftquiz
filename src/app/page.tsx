"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [riotId, setRiotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const stored = localStorage.getItem("quizUser");
      if (stored) {
        router.push("/quiz");
        return;
      }
      try {
        const res = await fetch("/api/me");
        const user = await res.json();
        if (user?.id) {
          localStorage.setItem("quizUser", JSON.stringify(user));
          router.push("/quiz");
          return;
        }
      } catch { /* ignore */ }
      setChecking(false);
    }
    checkUser();
  }, [router]);

  if (checking) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Cargando...</div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error registering");
      }

      const user = await res.json();
      localStorage.setItem("quizUser", JSON.stringify(user));
      router.push("/quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Riftbound Quiz
          </h1>
          <p className="text-gray-400 mt-2">Pon a prueba tu conocimiento</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Riot ID</label>
            <input
              type="text"
              value={riotId}
              onChange={(e) => setRiotId(e.target.value)}
              required
              placeholder="Nombre#TAG"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Empezar Quiz"}
          </button>
        </form>
      </div>
    </main>
  );
}
