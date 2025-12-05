"use client";

// biome-ignore assist/source/organizeImports: false positive
import { useState } from "react";
import { LogIn, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { notifySuccess, notifyError } from "@/lib/notify";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Erro de login";
        setError(errorMsg);
        notifyError(errorMsg);
        return;
      }
      notifySuccess("Login realizado com sucesso!");
      window.location.replace("/dashboard");
    } catch (err) {
      console.error(err);
      const errorMsg = "Erro de conexão";
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 fade-in">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 mb-4 shadow-lg">
            <Send size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-2">
            Envio Express
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Envie mensagens em massa com facilidade
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8 mb-6">
          <p className="text-[var(--text)] font-semibold mb-6 text-center text-lg">
            Faça login para continuar
          </p>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username"
              type="text"
              label="Usuário"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-center text-sm text-[var(--text-muted)]">
              Não tem conta?{" "}
              <Link
                href="/register"
                className="text-[var(--primary)] font-semibold hover:opacity-80 transition-opacity"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-[var(--text-muted)]">
          <p>Plataforma segura e confiável para envio em massa</p>
        </div>
      </div>
    </div>
  );
}
