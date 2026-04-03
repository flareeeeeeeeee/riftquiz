"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminContext = createContext<{ password: string }>({ password: "" });
export const useAdmin = () => useContext(AdminContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [input, setInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = sessionStorage.getItem("adminPassword");
    if (saved) {
      fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: saved }),
      }).then((res) => {
        if (res.ok) {
          setPassword(saved);
          setAuthenticated(true);
        } else {
          sessionStorage.removeItem("adminPassword");
        }
      });
    }
  }, []);

  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      if (!res.ok) {
        setError("Password incorrecto");
        return;
      }
      sessionStorage.setItem("adminPassword", input);
      setPassword(input);
      setAuthenticated(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setChecking(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Admin</h1>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold disabled:opacity-50"
          >
            {checking ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  const navItems = [
    { href: "/admin", label: "Preguntas" },
    { href: "/admin/questions/new", label: "Nueva Pregunta" },
    { href: "/admin/results", label: "Resultados" },
  ];

  return (
    <AdminContext.Provider value={{ password }}>
      <div className="flex-1 flex flex-col">
        <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Riftbound Admin
            </span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${
                  pathname === item.href ? "text-purple-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
