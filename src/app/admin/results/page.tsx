"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../layout";

interface MatrixData {
  questions: { id: string; text: string }[];
  users: { id: string; name: string; phone: string }[];
  answerMap: Record<string, Record<string, boolean>>;
}

export default function ResultsPage() {
  const { password } = useAdmin();
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const res = await fetch("/api/results", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [password]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) return <p className="text-gray-400">Cargando resultados...</p>;
  if (!data) return <p className="text-gray-500">Error cargando datos.</p>;

  const { questions, users, answerMap } = data;

  // Count correct per user
  function userScore(userId: string) {
    const map = answerMap[userId] || {};
    return Object.values(map).filter(Boolean).length;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Resultados ({users.length} usuarios, {questions.length} preguntas)
      </h1>

      {users.length === 0 ? (
        <p className="text-gray-500">Nadie ha respondido aun.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-950 px-3 py-2 text-left text-gray-400 font-medium border-b border-gray-800 min-w-[160px]">
                  Nombre
                </th>
                {questions.map((q, i) => (
                  <th
                    key={q.id}
                    title={q.text}
                    className="px-2 py-2 text-center text-gray-400 font-medium border-b border-gray-800 min-w-[40px]"
                  >
                    {i + 1}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-gray-400 font-medium border-b border-gray-800">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const map = answerMap[u.id] || {};
                const score = userScore(u.id);
                return (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="sticky left-0 z-10 bg-gray-950 px-3 py-2 text-white font-medium whitespace-nowrap">
                      {u.name}
                      <span className="text-gray-600 text-xs ml-2">{u.phone}</span>
                    </td>
                    {questions.map((q) => {
                      const answered = q.id in map;
                      const correct = map[q.id];
                      return (
                        <td key={q.id} className="px-1 py-1 text-center">
                          <div
                            className={`w-8 h-8 rounded mx-auto ${
                              !answered
                                ? "bg-gray-800"
                                : correct
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-white">
                      {score}/{questions.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
