"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ToastProvider";
import { Check, Copy, Zap, AlertCircle, ExternalLink, Lock } from "lucide-react";

interface Webhooks {
    sendMessage: string | null;
    createInstance?: string | null;
    verifyInstance?: string | null;
    connectInstance?: string | null;
    deleteInstance?: string | null;
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
    const [copied, setCopied] = useState(false);

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

    const copyToClipboard = async () => {
        if (webhooks.sendMessage) {
            await navigator.clipboard.writeText(webhooks.sendMessage);
            setCopied(true);
            showToast({ type: "success", message: "URL copiada!" });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        if (!newWebhook.trim()) {
            showToast({ type: "error", message: "URL do webhook não pode estar vazia" });
            return;
        }

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
                <main className="flex-1 min-h-screen p-4 sm:p-8" style={{ background: 'var(--bg)' }}>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4 animate-pulse">
                                    <Zap className="w-8 h-8 text-indigo-400" />
                                </div>
                                <p className="text-[var(--text-muted)]">Carregando informações...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (webhooks.sendMessage && !editing) {
        return (
            <ProtectedRoute>
                <main className="flex-1 min-h-screen p-4 sm:p-8" style={{ background: 'var(--bg)' }}>
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className="w-8 h-8 text-indigo-400" />
                                <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)]">
                                    Webhook Configurado
                                </h1>
                            </div>
                            <p className="text-[var(--text-muted)] text-lg ml-11">Seu fluxo N8N está pronto para produção</p>
                        </div>

                        <div className="card p-8 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/20 animate-pulse">
                                        <Check className="h-6 w-6 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
                                        ✨ Conexão Ativa
                                    </h3>
                                    <p className="text-[var(--text-muted)] text-sm">
                                        Seu webhook está conectado e pronto para enviar mensagens em massa
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 mb-8">
                            <p className="text-xs text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">🔗 URL do Webhook</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                                <div className="flex-1 w-full bg-white border rounded-xl px-4 py-3 overflow-x-auto">
                                    <code className="text-xs sm:text-sm text-[var(--text-muted)] font-mono break-all">
                                        {webhooks.sendMessage}
                                    </code>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="shrink-0 inline-flex items-center gap-2 bg-[var(--primary)] hover:opacity-95 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copiar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">Clique no botão para copiar a URL para o clipboard</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setEditing(true);
                                    setNewWebhook(webhooks.sendMessage || "");
                                }}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 group"
                            >
                                <span className="text-xl group-hover:rotate-12 transition-transform">✏️</span>
                                Editar Webhook
                            </button>
                            <a
                                href="https://wa.me/558592525311?text=Meu%20webhook%20não%20está%20funcionando%20corretamente%20no%20sistema%20de%20envio%20em%20massa."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-slate-600/50"
                            >
                                <span>❓</span>
                                Suporte
                            </a>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    if (editing) {
        return (
            <ProtectedRoute>
                <main className="flex-1 min-h-screen p-4 sm:p-8" style={{ background: 'var(--bg)' }}>
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl">✏️</span>
                                <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)]">
                                    Editar Webhook
                                </h1>
                            </div>
                            <p className="text-[var(--text-muted)] text-lg ml-20">Atualize a URL do seu fluxo N8N personalizado</p>
                        </div>

                        <div className="card p-8 mb-8">
                            <label className="block mb-6">
                                <p className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-indigo-400" />
                                    URL DO WEBHOOK N8N
                                </p>
                                <input
                                    type="url"
                                    placeholder="https://seu-n8n.com/webhook/seu-fluxo-customizado"
                                    value={newWebhook}
                                    onChange={(e) => setNewWebhook(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200 font-mono text-sm"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    Deve ser uma URL HTTPS válida e acessível de forma pública
                                </p>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/50"
                                >
                                    {saving ? "⏳ Salvando..." : "💾 Salvar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setNewWebhook(webhooks.sendMessage || "");
                                    }}
                                    disabled={saving}
                                    className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text)] mb-1">Validação em tempo real</p>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        A URL será validada antes de salvar. Certifique-se de que é uma URL válida e que seu webhook está ativo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="flex-1 min-h-screen p-4 sm:p-8" style={{ background: 'var(--bg)' }}>
                <div className="max-w-2xl mx-auto">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <Lock className="w-8 h-8 text-red-400" />
                            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)]">
                                Acesso Limitado
                            </h1>
                        </div>
                        <p className="text-[var(--text-muted)] text-lg ml-11">Webhook não configurado para sua conta</p>
                    </div>

                    <div className="card p-12 mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--danger-50)] mb-6 animate-pulse">
                            <AlertCircle className="w-8 h-8 text-[var(--danger)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
                            Configuração Pendente
                        </h3>
                        <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                            Para usar o sistema de envio em massa, o administrador precisa configurar seu webhook personalizado de N8N. Este webhook é específico para sua conta e garante que seus envios estejam isolados.
                        </p>
                    </div>

                    <div className="card p-8 mb-8">
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            Como proceder
                        </h3>
                        <div className="space-y-4">
                            {[
                                { num: 1, title: "Contate o Admin", text: "Use o botão abaixo para entrar em contato via WhatsApp" },
                                { num: 2, title: "Solicite Configuração", text: "Peça a configuração de seu webhook N8N personalizado" },
                                { num: 3, title: "Aguarde Confirmação", text: "Assim que configurado, você poderá usar o sistema normalmente" },
                            ].map((step) => (
                                <div key={step.num} className="flex gap-4 group">
                                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-semibold text-sm group-hover:bg-indigo-600/40 transition-colors">
                                        {step.num}
                                    </div>
                                    <div>
                                        <p className="text-[var(--text)] font-medium text-sm">{step.title}</p>
                                        <p className="text-[var(--text-muted)] text-sm">{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-4 mb-8">
                        <div className="flex gap-3">
                            <Zap className="w-5 h-5 text-[var(--info)] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)] mb-1">Por que um webhook personalizado?</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Cada webhook é específico para sua conta, garantindo que múltiplos usuários possam enviar mensagens simultaneamente sem conflitos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <a
                        href="https://wa.me/558592525311?text=Olá%21%20Preciso%20que%20você%20configure%20meu%20webhook%20N8N%20personalizado%20para%20o%20sistema%20de%20envio%20em%20massa."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-green-500/50 group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
                        <div className="text-left flex-1">
                            <p className="text-xs text-green-100">Clique para abrir WhatsApp</p>
                            <p className="text-sm font-semibold">Contatar Administrador</p>
                        </div>
                        <ExternalLink className="w-5 h-5 shrink-0" />
                    </a>
                </div>
            </main>
        </ProtectedRoute>
    );
}
