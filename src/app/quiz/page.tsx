"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO";
  answerType: "YES_NO" | "TEXT" | "NUMBER" | "MULTIPLE_CHOICE";
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  relatedImages: string[] | null;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string | null } | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startQuiz = useCallback(async () => {
    const stored = localStorage.getItem("quizUser");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    setQuestions(data.questions);
    if (data.attempt) setAttemptId(data.attempt.id);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  async function submitAnswer() {
    if (!answer || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/quiz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, questionId: questions[current].id, answer }),
    });
    const data = await res.json();
    setFeedback({ isCorrect: data.isCorrect, explanation: data.explanation });
    if (data.isCorrect) setScore((s) => s + 1);
    setSubmitting(false);
  }

  async function nextQuestion() {
    setFeedback(null);
    setAnswer("");
    if (current + 1 >= questions.length) {
      await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Cargando quiz...</div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No hay preguntas disponibles</h2>
          <p className="text-gray-400">Vuelve mas tarde cuando hayan preguntas.</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold mb-2">Quiz Completado!</h2>
          <p className="text-gray-400 mb-6">
            Gracias por participar! Tus respuestas han sido registradas.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const parsedOptions: string[] = q.options || [];

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <p className="text-sm text-gray-400 mb-4">Pregunta #{current + 1}</p>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {/* Media */}
          {q.mediaUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              {q.mediaType === "VIDEO" ? (
                <video src={q.mediaUrl} controls muted className="w-full max-h-80 object-contain bg-black" />
              ) : (
                <img src={q.mediaUrl} alt="Card" className="w-full max-h-80 object-contain" />
              )}
            </div>
          )}

          {/* Related card images */}
          {q.relatedImages && (() => {
            const imgs = Array.isArray(q.relatedImages) ? q.relatedImages : JSON.parse(q.relatedImages as unknown as string);
            return (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {imgs.map((imgUrl: string, i: number) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`Carta ${i + 1}`}
                    onClick={() => setLightbox({ images: imgs, index: i })}
                    className="h-40 max-w-56 object-contain rounded-lg border border-gray-700 bg-gray-800 flex-shrink-0 cursor-pointer hover:border-purple-500 transition"
                  />
                ))}
              </div>
            );
          })()}

          {/* Question */}
          <h2 className="text-xl font-semibold mb-6">{q.text}</h2>

          {/* Answer input */}
          {!feedback && (
            <div className="space-y-3">
              {q.answerType === "YES_NO" && (
                <div className="grid grid-cols-2 gap-3">
                  {["Si", "No"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt.toLowerCase())}
                      className={`py-3 rounded-xl border text-lg font-medium transition ${
                        answer === opt.toLowerCase()
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.answerType === "MULTIPLE_CHOICE" && (
                <div className="grid gap-3">
                  {parsedOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(opt.toLowerCase())}
                      className={`py-3 px-4 rounded-xl border text-left transition ${
                        answer === opt.toLowerCase()
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.answerType === "TEXT" && (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              )}

              {q.answerType === "NUMBER" && (
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Ingresa un numero..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              )}

              <button
                onClick={submitAnswer}
                disabled={!answer || submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Responder"}
              </button>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-900/30 border border-purple-700">
                <p className="font-semibold text-lg text-purple-300">Gracias por responder!</p>
              </div>

              <button
                onClick={nextQuestion}
                className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-semibold hover:bg-gray-700 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length }); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition"
          >
            &lt;
          </button>
          <img
            src={lightbox.images[lightbox.index]}
            alt={`Carta ${lightbox.index + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length }); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition"
          >
            &gt;
          </button>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition"
          >
            x
          </button>
          <div className="absolute bottom-6 text-gray-400 text-sm">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </main>
  );
}
