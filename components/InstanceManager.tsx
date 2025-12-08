"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, QrCode, Loader2, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface Instance {
    id: number;
    instanceName: string;
    status: "disconnected" | "connecting" | "online";
    qrCode: string | null;
    lastUpdate: string;
}

export default function InstanceManager() {
    const toast = useToast();
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [newInstanceName, setNewInstanceName] = useState("");
    const [creating, setCreating] = useState(false);
    const [connectingId, setConnectingId] = useState<number | null>(null);
    const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrCodeDisplay, setQrCodeDisplay] = useState<string | null>(null);
    const [selectedInstanceForQr, setSelectedInstanceForQr] = useState<Instance | null>(null);

    const fetchInstances = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/instances");
            if (res.ok) {
                const data = await res.json();
                setInstances(data.instances || []);
            }
        } catch {
            toast.showToast({ type: "error", message: "Erro ao carregar instâncias" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Carregar instâncias
    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    const createInstance = async () => {
        const name = newInstanceName.trim();
        if (!name) {
            toast.showToast({ type: "error", message: "Nome da instância é obrigatório" });
            return;
        }

        try {
            setCreating(true);
            const res = await fetch("/api/instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instanceName: name }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.showToast({ type: "error", message: data.error || "Erro ao criar instância" });
                return;
            }

            const data = await res.json();
            setInstances([...instances, data.instance]);
            setNewInstanceName("");

            // Feedback melhorado
            if (data.webhookCalled) {
                toast.showToast({
                    type: "success",
                    message: `✅ Instância "${name}" criada! Fluxo no N8N acionado para criar no Evolution.`
                });
            } else {
                toast.showToast({
                    type: "warning",
                    message: `⚠️ Instância "${name}" criada localmente, mas houve erro ao acionar o fluxo N8N. Verifique se o webhook está configurado corretamente em: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/instances`
                });
            }
        } catch (error) {
            console.error("Erro ao criar instância:", error);
            toast.showToast({ type: "error", message: "Erro ao criar instância. Verifique a conexão." });
        } finally {
            setCreating(false);
        }
    };

    const verifyInstanceConnected = async (instanceId: number): Promise<boolean> => {
        try {
            const res = await fetch(`/api/instances/${instanceId}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instanceName: instances.find(i => i.id === instanceId)?.instanceName }),
            });

            if (res.ok) {
                const data = await res.json();
                const isConnected = data.connected === true || data.instance?.status === "online";
                return isConnected;
            }
            return false;
        } catch {
            return false;
        }
    };

    const connectInstance = async (instanceId: number) => {
        try {
            setConnectingId(instanceId);
            const res = await fetch(`/api/instances/${instanceId}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "connect" }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.showToast({ type: "error", message: data.error || "Erro ao conectar" });
                return;
            }

            const data = await res.json();
            setInstances(instances.map(i => i.id === instanceId ? data.instance : i));

            // Se houver QR code, exibir
            if (data.instance.qrCode) {
                setQrCodeDisplay(data.instance.qrCode);
                setShowQrModal(true);

                // Iniciar polling para verificar se foi conectado
                let attemps = 0;
                const maxAttempts = 60; // 5 minutos (5s * 60)
                const pollInterval = setInterval(async () => {
                    attemps++;
                    const connected = await verifyInstanceConnected(instanceId);

                    if (connected) {
                        clearInterval(pollInterval);
                        setShowQrModal(false);
                        // Atualizar instância
                        const updatedRes = await fetch(`/api/instances/${instanceId}`);
                        if (updatedRes.ok) {
                            const { instance } = await updatedRes.json();
                            setInstances(instances.map(i => i.id === instanceId ? instance : i));
                        }
                        toast.showToast({ type: "success", message: "✅ Instância conectada com sucesso!" });
                    } else if (attemps >= maxAttempts) {
                        clearInterval(pollInterval);
                        toast.showToast({ type: "warning", message: "⏱️ Timeout na verificação. Feche o modal e tente novamente." });
                    }
                }, 5000); // Verificar a cada 5 segundos
            }

            toast.showToast({ type: "success", message: "Instância conectando..." });
        } catch {
            toast.showToast({ type: "error", message: "Erro ao conectar instância" });
        } finally {
            setConnectingId(null);
        }
    };

    const disconnectInstance = async (instanceId: number) => {
        try {
            setDisconnectingId(instanceId);
            const res = await fetch(`/api/instances/${instanceId}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "disconnect" }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.showToast({ type: "error", message: data.error || "Erro ao desconectar" });
                return;
            }

            const data = await res.json();
            setInstances(instances.map(i => i.id === instanceId ? data.instance : i));
            toast.showToast({ type: "success", message: "Instância desconectada" });
        } catch {
            toast.showToast({ type: "error", message: "Erro ao desconectar instância" });
        } finally {
            setDisconnectingId(null);
        }
    };

    const deleteInstance = async (instanceId: number) => {
        if (!confirm("Tem certeza que deseja deletar esta instância?")) return;

        try {
            const res = await fetch(`/api/instances/${instanceId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                toast.showToast({ type: "error", message: data.error || "Erro ao deletar" });
                return;
            }

            setInstances(instances.filter(i => i.id !== instanceId));
            toast.showToast({ type: "success", message: "Instância deletada" });
        } catch {
            toast.showToast({ type: "error", message: "Erro ao deletar instância" });
        }
    };

    const getStatusText = (status: string) => {
        const texts = {
            online: "Conectada",
            connecting: "Conectando...",
            disconnected: "Desconectada",
        };
        return texts[status as keyof typeof texts] || status;
    };

    if (loading) {
        return <div className="text-center py-8">Carregando instâncias...</div>;
    }

    const onlineCount = instances.filter(i => i.status === "online").length;
    const disconnectedCount = instances.filter(i => i.status === "disconnected").length;
    const connectingCount = instances.filter(i => i.status === "connecting").length;

    return (
        <div className="space-y-6">
            {/* Resumo de Instâncias */}
            {instances.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 font-medium mb-1">Conectadas</p>
                        <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700 font-medium mb-1">Conectando</p>
                        <p className="text-3xl font-bold text-yellow-600">{connectingCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700 font-medium mb-1">Desconectadas</p>
                        <p className="text-3xl font-bold text-red-600">{disconnectedCount}</p>
                    </div>
                </div>
            )}

            {/* Card de Criar Nova Instância */}
            <div className="bg-white rounded-lg shadow card-border p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Gerenciar Instâncias WhatsApp</h2>
                    <p className="text-sm text-[var(--text-muted)]">Crie, conecte e gerencie múltiplas instâncias WhatsApp em um único lugar</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" />
                        Criar Nova Instância
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newInstanceName}
                            onChange={(e) => setNewInstanceName(e.target.value)}
                            placeholder="Nome da instância (ex: whatsapp-pessoal, whatsapp-negocio)"
                            className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-[var(--text)] placeholder-[var(--text-muted)]"
                            onKeyPress={(e) => e.key === "Enter" && createInstance()}
                        />
                        <button
                            onClick={createInstance}
                            disabled={creating}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all"
                        >
                            {creating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Criar Instância
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Lista de instâncias */}
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 size={40} className="animate-spin mx-auto mb-4 text-[var(--text-muted)]" />
                        <p className="text-[var(--text-muted)]">Carregando suas instâncias...</p>
                    </div>
                ) : instances.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <QrCode size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
                        <p className="text-[var(--text-muted)] text-lg">Nenhuma instância criada ainda</p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">Comece criando sua primeira instância acima</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Suas Instâncias ({instances.length})</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {instances.map((instance) => (
                                <div
                                    key={instance.id}
                                    className="border border-[var(--border)] rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                                >
                                    {/* Header do Card */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-[var(--text)] truncate">{instance.instanceName}</h4>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${instance.status === "online"
                                                        ? "bg-green-500 animate-pulse"
                                                        : instance.status === "connecting"
                                                            ? "bg-yellow-500 animate-pulse"
                                                            : "bg-red-500"
                                                        }`}
                                                />
                                                <span className={`text-sm font-medium ${instance.status === "online"
                                                    ? "text-green-600"
                                                    : instance.status === "connecting"
                                                        ? "text-yellow-600"
                                                        : "text-red-600"
                                                    }`}>
                                                    {getStatusText(instance.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteInstance(instance.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                                            title="Deletar instância"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="text-xs text-[var(--text-muted)] mb-4 pb-4 border-b border-[var(--border)]">
                                        Criada em {new Date(instance.lastUpdate).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric"
                                        })}
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="flex flex-col gap-3">
                                        {instance.status === "disconnected" ? (
                                            <button
                                                onClick={() => connectInstance(instance.id)}
                                                disabled={connectingId === instance.id}
                                                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
                                            >
                                                {connectingId === instance.id ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Conectando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wifi size={16} />
                                                        Conectar Instância
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => disconnectInstance(instance.id)}
                                                disabled={disconnectingId === instance.id}
                                                className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
                                            >
                                                {disconnectingId === instance.id ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Desconectando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <WifiOff size={16} />
                                                        Desconectar
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {instance.qrCode && instance.status === "connecting" && (
                                            <button
                                                onClick={() => {
                                                    setQrCodeDisplay(instance.qrCode);
                                                    setSelectedInstanceForQr(instance);
                                                    setShowQrModal(true);
                                                }}
                                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text)] font-medium flex items-center justify-center gap-2 transition-all"
                                            >
                                                <QrCode size={16} />
                                                Ver QR Code
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de QR Code */}
            {showQrModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-[var(--border)]">
                            <h3 className="text-xl font-bold text-[var(--text)]">
                                Escaneie o QR Code
                            </h3>
                            {selectedInstanceForQr && (
                                <p className="text-sm text-[var(--text-muted)] mt-1">
                                    Instância: <strong>{selectedInstanceForQr.instanceName}</strong>
                                </p>
                            )}
                        </div>
                        <div className="p-8 flex justify-center bg-gray-50">
                            {qrCodeDisplay ? (
                                <img
                                    src={qrCodeDisplay}
                                    alt="QR Code"
                                    className="max-w-sm border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="text-center">
                                    <QrCode size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
                                    <p className="text-[var(--text-muted)]">QR code não disponível</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[var(--border)] flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
                            >
                                Fechar
                            </button>
                            {qrCodeDisplay && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = qrCodeDisplay;
                                        link.download = `qr-code-${selectedInstanceForQr?.instanceName || 'instancia'}.png`;
                                        link.click();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-all"
                                >
                                    Baixar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
