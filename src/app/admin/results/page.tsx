"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../layout";

interface AnswerDetail {
  isCorrect: boolean;
  answer: string;
}

interface MatrixData {
  questions: { id: string; text: string }[];
  users: { id: string; name: string; phone: string }[];
  answerMap: Record<string, Record<string, AnswerDetail>>;
}

export default function ResultsPage() {
  const { password } = useAdmin();
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ userName: string; questionText: string; answer: string; correct: boolean } | null>(null);

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

  function userScore(userId: string) {
    const map = answerMap[userId] || {};
    return Object.values(map).filter((a) => a.isCorrect).length;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          Resultados ({users.length} usuarios, {questions.length} preguntas)
        </h1>
        <button
          onClick={() => { setLoading(true); fetchResults(); }}
          className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
        >
          Refrescar
        </button>
      </div>

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
                      const detail = map[q.id];
                      const answered = !!detail;
                      return (
                        <td key={q.id} className="px-1 py-1 text-center">
                          <button
                            onClick={() => answered && setSelected({ userName: u.name, questionText: q.text, answer: detail.answer, correct: detail.isCorrect })}
                            className={`w-8 h-8 rounded mx-auto block ${
                              !answered
                                ? "bg-gray-800 cursor-default"
                                : detail.isCorrect
                                ? "bg-green-600 hover:bg-green-500 cursor-pointer"
                                : "bg-red-600 hover:bg-red-500 cursor-pointer"
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

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-400 text-sm mb-1">{selected.userName}</p>
            <p className="text-white font-medium mb-4">{selected.questionText}</p>
            <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${selected.correct ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
              {selected.answer}
            </div>
            <button onClick={() => setSelected(null)} className="block mt-4 text-gray-500 text-sm hover:text-gray-300">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
