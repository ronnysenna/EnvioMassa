"use client";

import { BarChart3, Send, Users, ArrowRight, Server, Wifi } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import DashboardMetrics from "./metrics";
import { useFirstInstanceStatus } from "@/lib/useFirstInstanceStatus";

export default function DashboardPage() {
  const { instance, loading } = useFirstInstanceStatus();
  const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

  return (
    <ProtectedRoute>
      <main className="flex-1 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[var(--text)] mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-[var(--text-muted)]">
              Gerencie seus contatos e envie mensagens em massa facilmente
            </p>
          </div>

          {/* Metrics */}
          <DashboardMetrics />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/enviar">
              <Card interactive className="group cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center py-6">
                  <div className="bg-indigo-100 p-4 rounded-lg mb-4 group-hover:bg-indigo-200 transition-colors">
                    <Send className="text-indigo-600" size={32} />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--text)] mb-1">
                    Enviar Mensagem
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Envie mensagens para seus contatos
                  </p>
                  <ArrowRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" size={20} />
                </CardContent>
              </Card>
            </Link>

            <Link href="/contatos">
              <Card interactive className="group cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center py-6">
                  <div className="bg-cyan-100 p-4 rounded-lg mb-4 group-hover:bg-cyan-200 transition-colors">
                    <Users className="text-cyan-600" size={32} />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--text)] mb-1">
                    Gerenciar Contatos
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Organize e gerencie sua base
                  </p>
                  <ArrowRight className="text-cyan-600 group-hover:translate-x-1 transition-transform" size={20} />
                </CardContent>
              </Card>
            </Link>

            <Link href="/grupos">
              <Card interactive className="group cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center py-6">
                  <div className="bg-emerald-100 p-4 rounded-lg mb-4 group-hover:bg-emerald-200 transition-colors">
                    <BarChart3 className="text-emerald-600" size={32} />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--text)] mb-1">
                    Criar Grupos
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Organize contatos em grupos
                  </p>
                  <ArrowRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" size={20} />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="💡 Dicas"
                description="Aproveite melhor o sistema"
              />
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-indigo-600 font-bold">1.</span>
                  <p className="text-sm text-[var(--text-muted)]">
                    Organize seus contatos em grupos para facilitar envios em massa
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-indigo-600 font-bold">2.</span>
                  <p className="text-sm text-[var(--text-muted)]">
                    Use imagens para tornar suas mensagens mais atrativas
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-indigo-600 font-bold">3.</span>
                  <p className="text-sm text-[var(--text-muted)]">
                    Confirme sempre antes de enviar para muitos contatos
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-indigo-600 font-bold">4.</span>
                  <p className="text-sm text-[var(--text-muted)]">
                    Mantenha o WhatsApp conectado para envios automáticos
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-indigo-600 font-bold">5.</span>
                  <p className="text-sm text-[var(--text-muted)]">
                    Importe contatos via CSV/XLSX para economizar tempo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="📊 Status do Sistema"
                description="Monitoramento em tempo real"
              />
              <CardContent className="space-y-4">
                {/* Status do Sistema */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-blue-600" />
                    <span className="text-sm text-[var(--text-muted)]">Sistema</span>
                  </div>
                  <span className="badge badge-success gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </div>

                {/* Status WhatsApp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className={instance?.status === "online" ? "text-green-600" : "text-red-600"} />
                    <span className="text-sm text-[var(--text-muted)]">WhatsApp</span>
                  </div>
                  <span className={loading ? "text-[var(--text-muted)]" : instance?.status === "online" ? "badge badge-success" : "badge badge-error"}>
                    {loading ? "Verificando..." : instance?.status === "online" ? "Conectado" : "Desconectado"}
                  </span>
                </div>

                {/* Versão Dinâmica */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Versão</span>
                  <span className="font-semibold text-[var(--text)] text-xs">
                    {APP_VERSION}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--text-muted)]">Suporte</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.open("https://wa.me/5585991904540", "_blank");
                    }}
                  >
                    Contatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
