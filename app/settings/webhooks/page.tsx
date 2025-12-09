"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className || ""}`}>
        {children}
    </div>
);

export default function WebhooksSettingsPage() {
    const { showToast } = useToast();
    const [webhookSendMessage, setWebhookSendMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchWebhooks = async () => {
            try {
                const res = await fetch("/api/user/webhooks", {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setWebhookSendMessage(data.webhooks.sendMessage);
                } else {
                    showToast({ type: "error", message: "Erro ao carregar webhook" });
                }
            } catch {
                showToast({
                    type: "error",
                    message: "Erro ao carregar webhook",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWebhooks();
    }, [showToast]);

    const handleSave = async () => {
        if (!webhookSendMessage || webhookSendMessage.trim() === "") {
            showToast({
                type: "error",
                message: "Webhook é obrigatório! Configure uma URL válida.",
            });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/user/webhooks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ webhookSendMessage }),
            });

            if (res.ok) {
                showToast({
                    type: "success",
                    message: "Webhook atualizado com sucesso!",
                });
            } else {
                const data = await res.json();
                showToast({ type: "error", message: data.error });
            }
        } catch {
            showToast({
                type: "error",
                message: "Erro ao salvar webhook",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12">Carregando webhook...</div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            📤 Webhook
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Configure seu webhook para enviar mensagens.
                        </p>
                    </div>

                    {/* Info Box */}
                    <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="p-4">
                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                Não tem webhook? <a href="https://wa.me/5585991904540" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:opacity-80">
                                    Solicite para o administrador
                                </a>
                            </p>
                        </div>
                    </Card>

                    {/* Webhook Input Card */}
                    <Card className="p-6 mb-8">
                        <input
                            type="url"
                            placeholder="https://seu-n8n.com/webhook/..."
                            value={webhookSendMessage || ""}
                            onChange={(e) => setWebhookSendMessage(e.target.value || null)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        {webhookSendMessage && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    ✓ Configurado
                                </p>
                            </div>
                        )}

                        {!webhookSendMessage && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    ❌ Não configurado
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
