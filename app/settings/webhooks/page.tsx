"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className || ""}`}>
        {children}
    </div>
);

interface Webhooks {
    sendMessage: string | null;
    createInstance: string | null;
    verifyInstance: string | null;
    connectInstance: string | null;
    deleteInstance: string | null;
}

export default function WebhooksSettingsPage() {
    const { showToast } = useToast();
    const [webhooks, setWebhooks] = useState<Webhooks>({
        sendMessage: null,
        createInstance: null,
        verifyInstance: null,
        connectInstance: null,
        deleteInstance: null,
    });
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
                    setWebhooks(data.webhooks);
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
        setSaving(true);
        try {
            const res = await fetch("/api/user/webhooks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(webhooks),
            });

            if (res.ok) {
                showToast({
                    type: "success",
                    message: "Webhooks atualizados com sucesso!",
                });
            } else {
                const data = await res.json();
                showToast({ type: "error", message: data.error });
            }
        } catch {
            showToast({
                type: "error",
                message: "Erro ao salvar webhooks",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setWebhooks({
            sendMessage: null,
            createInstance: null,
            verifyInstance: null,
            connectInstance: null,
            deleteInstance: null,
        });
        showToast({
            type: "info",
            message: "Webhooks redefinidos para padrão",
        });
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12">Carregando webhooks...</div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    const webhookConfig = [
        {
            key: "sendMessage" as keyof Webhooks,
            label: "Webhook - Enviar Mensagens",
            description: "URL do fluxo N8N para envio de mensagens em massa",
            icon: "📤",
        },
        {
            key: "createInstance" as keyof Webhooks,
            label: "Webhook - Criar Instância",
            description: "URL do fluxo N8N para criar nova instância WhatsApp",
            icon: "➕",
        },
        {
            key: "verifyInstance" as keyof Webhooks,
            label: "Webhook - Verificar Instância",
            description: "URL do fluxo N8N para verificar status da instância",
            icon: "✓",
        },
        {
            key: "connectInstance" as keyof Webhooks,
            label: "Webhook - Conectar Instância",
            description: "URL do fluxo N8N para gerar QR code e conectar",
            icon: "🔗",
        },
        {
            key: "deleteInstance" as keyof Webhooks,
            label: "Webhook - Deletar Instância",
            description: "URL do fluxo N8N para deletar instância",
            icon: "🗑️",
        },
    ];

    return (
        <ProtectedRoute>
            <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            ⚙️ Configurar Webhooks
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Configure as URLs dos seus fluxos N8N personalizados. Deixe vazio para usar o webhook padrão.
                        </p>
                    </div>

                    {/* Info Box */}
                    <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="p-4">
                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                <strong>💡 Dica:</strong> Cada usuário pode ter webhooks diferentes. Assim, quando você envia uma mensagem, ela vai para seu fluxo específico no N8N, sem conflitos com outros usuários.
                            </p>
                        </div>
                    </Card>

                    {/* Webhook Cards */}
                    <div className="space-y-4 mb-8">
                        {webhookConfig.map(({ key, label, description, icon }) => (
                            <Card key={key} className="p-6 hover:shadow-md transition-shadow">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-2xl">{icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {label}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://seu-n8n.com/webhook/user-X-..."
                                    value={webhooks[key] || ""}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setWebhooks((prev) => ({
                                            ...prev,
                                            [key]: e.target.value || null,
                                        }))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {webhooks[key] && (
                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                        <p className="text-xs text-green-800 dark:text-green-200">
                                            ✓ Configurado
                                        </p>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            {saving ? "Salvando..." : "💾 Salvar Webhooks"}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={saving}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            ↺ Usar Padrão
                        </button>
                    </div>

                    {/* Help Section */}
                    <Card className="mt-8 p-6 bg-gray-50 dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            ❓ Como funciona?
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li>
                                <strong>1.</strong> Crie um novo fluxo no N8N para cada webhook
                            </li>
                            <li>
                                <strong>2.</strong> Copie a URL do webhook gerado pelo N8N
                            </li>
                            <li>
                                <strong>3.</strong> Cole a URL no campo correspondente acima
                            </li>
                            <li>
                                <strong>4.</strong> Clique em "Salvar Webhooks"
                            </li>
                            <li>
                                <strong>5.</strong> Pronto! Agora seus dados irão para seu fluxo pessoal
                            </li>
                        </ul>
                    </Card>
                </div>
            </main>
        </ProtectedRoute>
    );
}
