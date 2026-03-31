"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "../../layout";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuid } from "uuid";

function uploadFile(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop();
    const storageRef = ref(storage, `rift-quiz/${uuid()}.${ext}`);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      "state_changed",
      (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => reject(err),
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

export default function NewQuestion() {
  const { password } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [text, setText] = useState("");
  const [answerType, setAnswerType] = useState<string>("YES_NO");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<string[]>([""]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<string>("IMAGE");
  const [relatedImages, setRelatedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingRelated, setUploadingRelated] = useState(false);
  const [relatedProgress, setRelatedProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadQuestion = useCallback(async () => {
    if (!editId) return;
    const res = await fetch(`/api/questions/${editId}`);
    if (!res.ok) return;
    const q = await res.json();
    setText(q.text);
    setAnswerType(q.answerType);
    setCorrectAnswer(q.correctAnswer);
    setExplanation(q.explanation || "");
    setOptions(q.options ? JSON.parse(q.options) : [""]);
    setMediaUrl(q.mediaUrl || "");
    setMediaType(q.mediaType || "IMAGE");
    setRelatedImages(q.relatedImages ? JSON.parse(q.relatedImages) : []);
  }, [editId]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const url = await uploadFile(file, setUploadProgress);
      setMediaUrl(url);
      setMediaType(file.type.startsWith("video/") ? "VIDEO" : "IMAGE");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRelatedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRelated(true);
    setRelatedProgress(0);
    setUploadError("");

    try {
      const url = await uploadFile(file, setRelatedProgress);
      setRelatedImages((prev) => [...prev, url]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingRelated(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      text,
      answerType,
      correctAnswer,
      explanation: explanation || null,
      options: answerType === "MULTIPLE_CHOICE" ? options.filter((o) => o.trim()) : null,
      mediaUrl: mediaUrl || null,
      mediaType,
      relatedImages: relatedImages.length > 0 ? relatedImages : null,
      order: 0,
      active: true,
    };

    const url = editId ? `/api/questions/${editId}` : "/api/questions";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(body),
    });

    router.push("/admin");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{editId ? "Editar" : "Nueva"} Pregunta</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Question text */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pregunta</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={3}
            placeholder="Escribe la pregunta..."
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
          />
        </div>

        {/* Media upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Media (imagen o video)</label>
          <div className="flex gap-3 items-start">
            <label className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm cursor-pointer hover:bg-gray-700 transition">
              {uploading ? `Subiendo... ${uploadProgress}%` : "Subir archivo"}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {mediaUrl && (
              <div className="flex-1">
                <div className="rounded-xl overflow-hidden bg-gray-800 max-h-48">
                  {mediaType === "VIDEO" ? (
                    <video src={mediaUrl} controls muted className="max-h-48 object-contain" />
                  ) : (
                    <img src={mediaUrl} alt="Preview" className="max-h-48 object-contain" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="text-red-400 text-xs mt-1 hover:text-red-300"
                >
                  Quitar media
                </button>
              </div>
            )}
          </div>
          {uploading && (
            <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Related card images */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cartas relacionadas (imagenes)</label>
          <div className="flex flex-wrap gap-3 mb-2">
            {relatedImages.map((imgUrl, i) => (
              <div key={i} className="relative group">
                <img
                  src={imgUrl}
                  alt={`Carta ${i + 1}`}
                  className="h-32 max-w-48 object-contain rounded-lg border border-gray-700 bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setRelatedImages(relatedImages.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <label className="inline-block px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm cursor-pointer hover:bg-gray-700 transition">
            {uploadingRelated ? `Subiendo... ${relatedProgress}%` : "+ Agregar carta"}
            <input
              type="file"
              accept="image/*"
              onChange={handleRelatedUpload}
              className="hidden"
              disabled={uploadingRelated}
            />
          </label>
          {uploadingRelated && (
            <div className="mt-2 w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${relatedProgress}%` }}
              />
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-red-400 text-sm">{uploadError}</p>
        )}

        {/* Answer type */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tipo de respuesta</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: "YES_NO", label: "Si / No" },
              { value: "TEXT", label: "Texto" },
              { value: "NUMBER", label: "Numero" },
              { value: "MULTIPLE_CHOICE", label: "Opciones" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setAnswerType(t.value)}
                className={`py-2 rounded-xl border text-sm font-medium transition ${
                  answerType === t.value
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multiple choice options */}
        {answerType === "MULTIPLE_CHOICE" && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Opciones</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...options];
                      copy[i] = e.target.value;
                      setOptions(copy);
                    }}
                    placeholder={`Opcion ${i + 1}`}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      className="px-3 text-red-400 hover:text-red-300"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOptions([...options, ""])}
                className="text-purple-400 text-sm hover:text-purple-300"
              >
                + Agregar opcion
              </button>
            </div>
          </div>
        )}

        {/* Correct answer */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Respuesta correcta</label>
          {answerType === "YES_NO" ? (
            <div className="grid grid-cols-2 gap-2">
              {["si", "no"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCorrectAnswer(opt)}
                  className={`py-2 rounded-xl border text-sm font-medium transition ${
                    correctAnswer === opt
                      ? "border-green-500 bg-green-500/20 text-green-300"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {opt === "si" ? "Si" : "No"}
                </button>
              ))}
            </div>
          ) : answerType === "MULTIPLE_CHOICE" ? (
            <div className="grid gap-2">
              {options.filter((o) => o.trim()).map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCorrectAnswer(opt.toLowerCase())}
                  className={`py-2 px-4 rounded-xl border text-sm text-left transition ${
                    correctAnswer === opt.toLowerCase()
                      ? "border-green-500 bg-green-500/20 text-green-300"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type={answerType === "NUMBER" ? "number" : "text"}
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              required
              placeholder="Respuesta correcta..."
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Explicacion (opcional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="Por que esta es la respuesta correcta..."
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading || uploadingRelated}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-500 hover:to-cyan-500 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : editId ? "Actualizar" : "Crear Pregunta"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
