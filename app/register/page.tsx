"use client";

// biome-ignore assist/source/organizeImports: false positive
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { notifySuccess, notifyError } from "@/lib/notify";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validação básica
    if (password !== confirmPassword) {
      setError("As senhas não correspondem");
      notifyError("As senhas não correspondem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      notifyError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Erro no registro";
        setError(errorMsg);
        notifyError(errorMsg);
        return;
      }
      notifySuccess("Conta criada com sucesso! Redirecionando para login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (_err) {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-emerald-500 to-cyan-500 mb-4 shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-2">
            Envio Express
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Comece a enviar agora mesmo
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8 mb-6">
          <p className="text-[var(--text)] font-semibold mb-6 text-center text-lg">
            Crie sua conta
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
              placeholder="Escolha um nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              helperText="Use uma senha forte"
              required
            />

            <Input
              id="confirm-password"
              type="password"
              label="Confirmar Senha"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-center text-sm text-[var(--text-muted)]">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="text-[var(--primary)] font-semibold hover:opacity-80 transition-opacity"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div className="p-3 rounded-lg bg-panel border border-[var(--border)]">
            <div className="text-xl mb-2">🚀</div>
            <p className="text-[var(--text-muted)]">Rápido</p>
          </div>
          <div className="p-3 rounded-lg bg-panel border border-[var(--border)]">
            <div className="text-xl mb-2">🔒</div>
            <p className="text-[var(--text-muted)]">Seguro</p>
          </div>
          <div className="p-3 rounded-lg bg-panel border border-[var(--border)]">
            <div className="text-xl mb-2">✨</div>
            <p className="text-[var(--text-muted)]">Simples</p>
          </div>
        </div>
      </div>
    </div>
  );
}
