"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "./layout";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  mediaUrl: string | null;
  mediaType: string;
  answerType: string;
  correctAnswer: string;
  order: number;
  active: boolean;
}

export default function AdminQuestions() {
  const { password } = useAdmin();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    const res = await fetch("/api/questions");
    setQuestions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function toggleActive(q: Question) {
    await fetch(`/api/questions/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ ...q, active: !q.active }),
    });
    fetchQuestions();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Eliminar esta pregunta?")) return;
    await fetch(`/api/questions/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    fetchQuestions();
  }

  if (loading) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Preguntas ({questions.length})</h1>
        <Link
          href="/admin/questions/new"
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition"
        >
          + Nueva Pregunta
        </Link>
      </div>

      {questions.length === 0 ? (
        <p className="text-gray-500">No hay preguntas. Crea la primera!</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
              <span className="text-gray-500 text-sm w-8">#{i + 1}</span>
              {q.mediaUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                  {q.mediaType === "VIDEO" ? (
                    <video src={q.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={q.mediaUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{q.text}</p>
                <p className="text-gray-500 text-xs mt-1 no-underline decoration-0">
                  {q.answerType} &middot; Respuesta: {q.correctAnswer}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(q)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    q.active ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {q.active ? "Activa" : "Inactiva"}
                </button>
                <Link
                  href={`/admin/questions/new?edit=${q.id}`}
                  className="px-3 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
                >
                  Editar
                </Link>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
