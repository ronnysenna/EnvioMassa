"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { X, QrCode, RotateCcw, Power, Wifi } from "lucide-react";
import Button from "@/components/ui/Button";
import { useInstanceManager } from "@/lib/useInstanceManager";
import Alert from "@/components/ui/Alert";

interface InstanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    refetchStatus?: () => void;
}

export default function InstanceModal({ isOpen, onClose, refetchStatus }: InstanceModalProps) {
    const { instance, loading, error, connect, restart, disconnect, refetch } = useInstanceManager();
    const [showQR, setShowQR] = useState(false);
    const prevStatusRef = useRef<string | null>(null);

    useEffect(() => {
        // Only auto-close when status transitions from non-online -> online while modal is open
        const prev = prevStatusRef.current;
        const current = instance?.status ?? null;

        if (isOpen && prev !== "online" && current === "online") {
            setShowQR(false);
            refetchStatus?.();
            onClose();
        }

        // update prevStatus after check
        prevStatusRef.current = current;
    }, [instance?.status, isOpen, refetchStatus, onClose]);

    if (!isOpen) return null;

    const isConnected = instance?.status === "online";
    const isConnecting = Boolean(instance?.connecting) || instance?.status === "connecting";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={24} className="text-indigo-600" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Conectar Instância</h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status Atual</p>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`}></div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{instance?.instancia ?? "Desconectado"}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{isConnected ? "✓ Conectado" : isConnecting ? "⟳ Conectando..." : "✗ Desconectado"}</p>
                        </div>
                    </div>
                </div>

                {error && <Alert variant="error" className="mb-4">{error}</Alert>}

                {showQR && instance?.qrCode && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Escaneie o QR code com seu celular</p>
                        <div className="w-48 h-48 mx-auto border-4 border-white dark:border-slate-700 rounded overflow-hidden">
                            <Image src={instance.qrCode} alt="QR Code" width={192} height={192} unoptimized className="object-contain" />
                        </div>
                        <button type="button" onClick={() => setShowQR(false)} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Fechar QR Code</button>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    {!isConnected && !isConnecting && (
                        <Button variant="primary" size="lg" className="w-full" isLoading={loading} onClick={async () => { await connect(); setShowQR(true); refetchStatus?.(); }}>
                            <QrCode size={18} className="mr-2" />
                            Conectar (Gerar QR)
                        </Button>
                    )}

                    {(isConnected || isConnecting) && (
                        <>
                            <Button variant="secondary" size="lg" className="w-full" isLoading={loading} onClick={async () => { await restart(); await refetch(); refetchStatus?.(); }}>
                                <RotateCcw size={18} className="mr-2" />
                                Reiniciar Conexão
                            </Button>

                            <Button variant="danger" size="lg" className="w-full" isLoading={loading} onClick={async () => { await disconnect(); await refetch(); refetchStatus?.(); }}>
                                <Power size={18} className="mr-2" />
                                Desconectar
                            </Button>
                        </>
                    )}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">💡 Dica:</p>
                    <p>Abrir o WhatsApp, tocar em "Conectar a um dispositivo" e escanear o QR code.</p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">Última atualização: {instance?.lastUpdate ? new Date(instance.lastUpdate).toLocaleTimeString("pt-BR") : "—"}</p>
            </div>
        </div>
    );
}
