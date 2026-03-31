"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../layout";

interface Attempt {
  id: string;
  score: number;
  totalQ: number;
  startedAt: string;
  completedAt: string;
  user: { name: string; phone: string };
  answers: {
    answer: string;
    isCorrect: boolean;
    question: { text: string; correctAnswer: string };
  }[];
}

export default function ResultsPage() {
  const { password } = useAdmin();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    const res = await fetch("/api/results", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setAttempts(await res.json());
    setLoading(false);
  }, [password]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) return <p className="text-gray-400">Cargando resultados...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resultados ({attempts.length})</h1>

      {attempts.length === 0 ? (
        <p className="text-gray-500">Nadie ha completado el quiz aun.</p>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <div key={a.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-800/50 transition"
              >
                <div className={`text-2xl font-bold ${
                  a.score === a.totalQ ? "text-green-400" :
                  a.score >= a.totalQ * 0.7 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {a.score}/{a.totalQ}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{a.user.name}</p>
                  <p className="text-gray-500 text-xs">{a.user.phone} &middot; {new Date(a.completedAt).toLocaleString()}</p>
                </div>
                <span className="text-gray-500 text-sm">{expanded === a.id ? "▲" : "▼"}</span>
              </button>

              {expanded === a.id && (
                <div className="px-4 pb-4 space-y-2">
                  {a.answers.map((ans, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${ans.isCorrect ? "bg-green-900/20" : "bg-red-900/20"}`}>
                      <p className="text-gray-300">{ans.question.text}</p>
                      <div className="flex gap-4 mt-1">
                        <span className={ans.isCorrect ? "text-green-400" : "text-red-400"}>
                          Respuesta: {ans.answer}
                        </span>
                        {!ans.isCorrect && (
                          <span className="text-gray-500">Correcta: {ans.question.correctAnswer}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
