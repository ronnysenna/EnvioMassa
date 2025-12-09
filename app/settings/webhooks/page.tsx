"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";

interface Webhooks {
    sendMessage: string | null;
}

export default function WebhooksSettingsPage() {
    const { showToast } = useToast();
    const [webhooks, setWebhooks] = useState<Webhooks>({
        sendMessage: null,
    });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [newWebhook, setNewWebhook] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchWebhooks = async () => {
            try {
                const res = await fetch("/api/user/webhooks", {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setWebhooks(data.webhooks);
                    setNewWebhook(data.webhooks.sendMessage || "");
                } else {
                    showToast({ type: "error", message: "Erro ao carregar webhooks" });
                }
            } catch {
                showToast({
                    type: "error",
                    message: "Erro ao carregar webhooks",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWebhooks();
    }, [showToast]);

    const handleSave = async () => {
        if (!newWebhook.trim()) {
            showToast({ type: "error", message: "URL do webhook não pode estar vazia" });
            return;
        }

        // Validar URL
        try {
            new URL(newWebhook);
        } catch {
            showToast({ type: "error", message: "URL inválida" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/user/webhooks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ webhookSendMessage: newWebhook }),
            });

            if (res.ok) {
                const data = await res.json();
                setWebhooks({ sendMessage: data.webhooks.sendMessage });
                setEditing(false);
                showToast({ type: "success", message: "Webhook atualizado com sucesso!" });
            } else {
                const data = await res.json();
                showToast({ type: "error", message: data.error });
            }
        } catch {
            showToast({ type: "error", message: "Erro ao salvar webhook" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12">Carregando informações...</div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    // Se o webhook está configurado, mostrar mensagem de sucesso
    if (webhooks.sendMessage && !editing) {
        return (
            <ProtectedRoute>
                <main className="flex-1 bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 min-h-screen p-4 sm:p-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">✅</div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Webhook Configurado!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Seu webhook para envio de mensagens está ativo e funcionando.
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-8 break-all">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">URL do Webhook:</p>
                                <code className="text-sm text-gray-900 dark:text-white">{webhooks.sendMessage}</code>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(true);
                                    setNewWebhook(webhooks.sendMessage || "");
                                }}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                            >
                                <span className="text-xl">✏️</span>
                                Trocar Webhook
                            </button>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    // Se está em modo de edição
    if (editing) {
        return (
            <ProtectedRoute>
                <main className="flex-1 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 min-h-screen p-4 sm:p-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center py-10">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                                ✏️ Editar Webhook
                            </h1>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
                                <label className="block text-left mb-4">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                        URL do Webhook N8N
                                    </span>
                                    <input
                                        type="url"
                                        placeholder="https://seu-n8n.com/webhook/envio..."
                                        value={newWebhook}
                                        onChange={(e) => setNewWebhook(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </label>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        {saving ? "Salvando..." : "💾 Salvar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(false);
                                            setNewWebhook(webhooks.sendMessage || "");
                                        }}
                                        disabled={saving}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        ✕ Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    // Se não há webhook configurado, mostrar pedido para entrar em contato com o admin
    return (
        <ProtectedRoute>
            <main className="flex-1 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 min-h-screen p-4 sm:p-6">
                <div className="max-w-2xl mx-auto flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Webhook Não Configurado
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                            Para começar a enviar mensagens em massa, o administrador do sistema precisa configurar seu webhook de envio.
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                            <p className="text-sm text-blue-900 dark:text-blue-200 mb-4">
                                <strong>📝 O que fazer:</strong>
                            </p>
                            <ol className="text-left text-sm text-blue-900 dark:text-blue-200 space-y-2 list-decimal list-inside">
                                <li>Entre em contato com o administrador do sistema</li>
                                <li>Solicite a configuração de seu webhook N8N pessoal</li>
                                <li>Assim que configurado, você poderá usar o sistema</li>
                            </ol>
                        </div>

                        <a
                            href="https://wa.me/558592525311?text=Olá%20Ronny%21%20Preciso%20que%20você%20configure%20meu%20webhook%20para%20o%20sistema%20de%20envio%20em%20massa."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                        >
                            <span className="text-xl">💬</span>
                            Contatar Administrador via WhatsApp
                        </a>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
