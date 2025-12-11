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
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 fade-in">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text)] mb-2">
            Registro Desativado
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            O registro público foi desativado
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-8 mb-6">
          <Alert variant="warning" className="mb-6">
            Apenas administradores podem criar novas contas
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-[var(--text)]">
              Para criar uma conta, entre em contato com o administrador do sistema.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Voltar para Login
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-[var(--text-muted)]">
          <p>Esta é uma medida de segurança para controle de acesso</p>
        </div>
      </div>
    </div>
  );
}
