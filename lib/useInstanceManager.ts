import { useCallback, useEffect, useRef, useState } from "react";

export interface InstanceData {
  instancia: string | null;
  status: string | null;
  qrCode: string | null;
  lastUpdate: string | null;
  connecting: boolean;
}

export function useInstanceManager() {
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shortPollRef = useRef<number | null>(null);
  const shortPollTimeoutRef = useRef<number | null>(null);

  const normalize = useCallback((raw: unknown): InstanceData | null => {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    // considerar vários campos que o webhook pode retornar: connectionStatus, status, state, statusText
    const statusRaw = (r.connectionStatus ??
      r.status ??
      r.state ??
      r.statusText) as string | undefined | null;
    let mappedStatus: string | null = null;
    if (statusRaw !== undefined && statusRaw !== null) {
      const s = String(statusRaw).toLowerCase();
      if (s === "open" || s === "online" || s === "connected")
        mappedStatus = "online";
      else if (s === "closed" || s === "offline" || s === "disconnected")
        mappedStatus = "offline";
      else if (s === "connecting" || s === "pending")
        mappedStatus = "connecting";
      else mappedStatus = s;
    }

    return {
      instancia: (r.instancia ?? r.name ?? null) as string | null,
      status: (mappedStatus ?? null) as string | null,
      qrCode: (r.qrCode ?? r.qr ?? r.qrcode ?? null) as string | null,
      lastUpdate: (r.lastUpdate ?? r.updatedAt ?? null) as string | null,
      connecting: !!r.connecting,
    } as InstanceData;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/instance/connect", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setInstance(normalize(data.data ?? null));
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Erro ao buscar status");
      }
    } catch (err) {
      console.error("Error fetching instance status:", err);
      setError("Erro ao buscar status");
    } finally {
      setLoading(false);
    }
  }, [normalize]);

  // polling curto que roda a cada `intervalMs` até timeoutMs ou até status === 'online'
  const startShortPollingUntilOnline = useCallback(
    (intervalMs = 2000, timeoutMs = 30000) => {
      // limpar qualquer polling existente
      if (shortPollRef.current) {
        clearInterval(shortPollRef.current);
        shortPollRef.current = null;
      }
      if (shortPollTimeoutRef.current) {
        clearTimeout(shortPollTimeoutRef.current);
        shortPollTimeoutRef.current = null;
      }

      const check = async () => {
        try {
          const res = await fetch("/api/instance/connect");
          if (res.ok) {
            const data = await res.json();
            const normalized = normalize(data.data ?? null);
            setInstance(normalized);
            if (normalized?.status === "online") {
              // já conectado -> parar polling
              if (shortPollRef.current) {
                clearInterval(shortPollRef.current);
                shortPollRef.current = null;
              }
              if (shortPollTimeoutRef.current) {
                clearTimeout(shortPollTimeoutRef.current);
                shortPollTimeoutRef.current = null;
              }
            }
          }
        } catch (err) {
          console.error("Error during short polling status:", err);
        }
      };

      // primeira checagem imediata
      check();

      const id = window.setInterval(check, intervalMs);
      shortPollRef.current = id as unknown as number;

      const to = window.setTimeout(() => {
        if (shortPollRef.current) {
          clearInterval(shortPollRef.current);
          shortPollRef.current = null;
        }
        shortPollTimeoutRef.current = null;
      }, timeoutMs);
      shortPollTimeoutRef.current = to as unknown as number;
    },
    [normalize]
  );

  const stopShortPolling = useCallback(() => {
    if (shortPollRef.current) {
      clearInterval(shortPollRef.current);
      shortPollRef.current = null;
    }
    if (shortPollTimeoutRef.current) {
      clearTimeout(shortPollTimeoutRef.current);
      shortPollTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/instance/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInstance(normalize(data.data ?? null));
        setError(null);
        // forçar refetch imediato para garantir atualização
        await fetchStatus();
        // iniciar polling curto até ficar online
        startShortPollingUntilOnline(2000, 30000);
      } else {
        setError(data.error || "Erro ao conectar");
      }
    } catch (err) {
      console.error("Error connecting:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [normalize, fetchStatus, startShortPollingUntilOnline]);

  const restart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/instance/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInstance(normalize(data.data ?? null));
        // refetch para obter estado atualizado
        await fetchStatus();
      } else {
        setError(data.error || "Erro ao reiniciar");
      }
    } catch (err) {
      console.error("Error restarting:", err);
      setError("Erro ao reiniciar");
    } finally {
      setLoading(false);
    }
  }, [normalize, fetchStatus]);

  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/instance/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInstance(normalize(data.data ?? null));
        // refetch para garantir estado
        await fetchStatus();
      } else {
        setError(data.error || "Erro ao desconectar");
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      setError("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  }, [normalize, fetchStatus]);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(fetchStatus, 5000);
    return () => {
      clearInterval(interval);
      stopShortPolling();
    };
  }, [fetchStatus, stopShortPolling]);

  return {
    instance,
    loading,
    error,
    connect,
    restart,
    disconnect,
    refetch: fetchStatus,
    // helpers para testes
    _stopShortPolling: stopShortPolling,
  };
}
