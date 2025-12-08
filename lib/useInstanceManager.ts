"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notifyError, notifySuccess } from "./notify";

type RawPayload = unknown;

export type InstanceData = {
  instancia?: string | null;
  status?: "online" | "offline" | "connecting" | string | null;
  qrCode?: string | null;
  lastUpdate?: string | null;
  connecting?: boolean | null;
  _raw?: unknown;
  [k: string]: unknown;
};

function stripMustache(v: unknown): string | null {
  if (typeof v === "string") {
    const cleaned = v.replace(/{{[^}]*}}/g, "").trim();
    return cleaned.length > 0 ? cleaned : v.trim() || null;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function mapStatus(raw?: string | null | undefined): InstanceData["status"] {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase();
  if (s === "open") return "online";
  if (s === "closed") return "offline";
  if (s === "connecting") return "connecting";
  if (s === "connected") return "online";
  if (s === "disconnected") return "offline";
  return s;
}

function normalize(payload: RawPayload): InstanceData | undefined {
  if (payload === undefined || payload === null) return undefined;

  let obj: unknown = Array.isArray(payload) ? payload[0] ?? payload : payload;

  if (obj && typeof obj === "object") {
    const maybe = obj as Record<string, unknown>;
    if (Array.isArray(maybe.data)) {
      obj = maybe.data[0] ?? maybe.data;
    }
  }

  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;

  const possibleName =
    o.instancia ?? o.name ?? o.instance ?? o.instanciaName ?? o.instanceName;
  const possibleStatus =
    o.status ??
    o.connectionStatus ??
    o.state ??
    o.statusText ??
    o.connectionstatus;
  const possibleQr = o.qrCode ?? o.qrcode ?? o.qr ?? o.dataUrl ?? o.qr_data;
  const lastUpdate = o.lastUpdate ?? o.updatedAt ?? o.updated_at ?? o.timestamp;
  const connecting =
    o.connecting ??
    (typeof possibleStatus === "string"
      ? String(possibleStatus).toLowerCase().includes("connect")
      : undefined);

  const cleanName = stripMustache(possibleName);
  const cleanQr = stripMustache(possibleQr);

  const mappedStatus = mapStatus(
    typeof possibleStatus === "string"
      ? possibleStatus
      : (stripMustache(possibleStatus) as string | null | undefined)
  );

  const normalized: InstanceData = {
    instancia: cleanName ?? null,
    status: mappedStatus ?? null,
    qrCode: cleanQr ?? null,
    lastUpdate: lastUpdate ? String(lastUpdate) : null,
    connecting:
      typeof connecting === "boolean"
        ? connecting
        : !!(mappedStatus === "connecting"),
    _raw: payload,
  };

  return normalized;
}

export function useInstanceManager(opts?: {
  shortPollInterval?: number;
  shortPollTimeout?: number;
}) {
  const shortPollInterval = opts?.shortPollInterval ?? 2000; // 2s
  const shortPollTimeout = opts?.shortPollTimeout ?? 30000; // 30s

  const [data, setData] = useState<InstanceData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const shortPollTimer = useRef<number | null>(null);
  const shortPollStopAt = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (shortPollTimer.current) {
        window.clearInterval(shortPollTimer.current);
        shortPollTimer.current = null;
      }
      shortPollStopAt.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopShortPoll = useCallback(() => {
    if (shortPollTimer.current) {
      window.clearInterval(shortPollTimer.current);
      shortPollTimer.current = null;
    }
    shortPollStopAt.current = null;
  }, []);

  const fetchStatus = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // Buscar primeira instância do usuário para demo
      const listRes = await fetch("/api/instances", { signal });
      if (!listRes.ok) throw new Error(`Status ${listRes.status}`);
      const listJson = (await listRes.json()) as Record<string, unknown>;
      const instances = (listJson.instances ?? []) as Array<{ id?: number }>;
      const firstInstance = instances[0];

      if (!firstInstance || !firstInstance.id) {
        // Nenhuma instância criada
        const normalized = normalize(undefined);
        if (!mountedRef.current) return normalized;
        setData(normalized);
        setLoading(false);
        return normalized;
      }

      // Buscar status da primeira instância
      const res = await fetch(`/api/instances/${firstInstance.id}`, { signal });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as unknown;
      const j = json as Record<string, unknown>;
      const payload =
        j && typeof j === "object" && "instance" in j ? j.instance : json;
      const normalized = normalize(payload);
      console.debug(
        "[useInstanceManager] raw payload:",
        json,
        "normalized:",
        normalized
      );
      if (!mountedRef.current) return normalized;
      setData(normalized);
      setLoading(false);
      return normalized;
    } catch (err: unknown) {
      // Ignore AbortErrors (happens when component unmounts / effect aborts)
      const name = (err as { name?: unknown })?.name as string | undefined;
      if (name === "AbortError") {
        console.debug("[useInstanceManager] fetchStatus aborted");
        // do not set error for controlled aborts
        if (mountedRef.current) setLoading(false);
        return undefined;
      }

      if (!mountedRef.current) return undefined;
      const message = err instanceof Error ? err.message : String(err);
      console.debug("[useInstanceManager] fetchStatus error:", err);
      setError(message);
      setLoading(false);
      return undefined;
    }
  }, []);

  const startShortPollUntilOnline = useCallback(() => {
    stopShortPoll();
    shortPollStopAt.current = Date.now() + shortPollTimeout;

    const attempt = async () => {
      const current = await fetchStatus();
      if (current?.status === "online") {
        stopShortPoll();
        if (typeof notifySuccess === "function")
          notifySuccess("Instância conectada");
      } else if (
        shortPollStopAt.current &&
        Date.now() >= shortPollStopAt.current
      ) {
        stopShortPoll();
        if (typeof notifyError === "function")
          notifyError("Timeout: não detectado estado online");
      }
    };

    void attempt();
    shortPollTimer.current = window.setInterval(() => {
      void attempt();
    }, shortPollInterval) as unknown as number;
  }, [fetchStatus, shortPollInterval, shortPollTimeout, stopShortPoll]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar primeira instância
      const listRes = await fetch("/api/instances");
      if (!listRes.ok) throw new Error(`Status ${listRes.status}`);
      const listJson = (await listRes.json()) as Record<string, unknown>;
      const instances = (listJson.instances ?? []) as Array<{ id?: number }>;
      const firstInstance = instances[0];

      if (!firstInstance || !firstInstance.id) {
        throw new Error("Nenhuma instância criada");
      }

      // Conectar primeira instância
      const res = await fetch(`/api/instances/${firstInstance.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as unknown;
      const j = json as Record<string, unknown>;
      const payload =
        j && typeof j === "object" && "instance" in j ? j.instance : json;
      const normalized = normalize(payload);
      console.debug(
        "[useInstanceManager] connect response:",
        json,
        "normalized:",
        normalized
      );
      if (mountedRef.current)
        setData((prev) => ({ ...(prev ?? {}), ...(normalized ?? {}) }));

      startShortPollUntilOnline();

      if (typeof notifySuccess === "function")
        notifySuccess("QR gerado, aguardando conexão");
      setLoading(false);
      return normalized;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.debug("[useInstanceManager] connect error:", err);
      if (mountedRef.current) setError(message);
      if (typeof notifyError === "function")
        notifyError("Falha ao iniciar conexão");
      setLoading(false);
      return undefined;
    }
  }, [startShortPollUntilOnline]);

  const restart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar primeira instância
      const listRes = await fetch("/api/instances");
      if (!listRes.ok) throw new Error(`Status ${listRes.status}`);
      const listJson = (await listRes.json()) as Record<string, unknown>;
      const instances = (listJson.instances ?? []) as Array<{ id?: number }>;
      const firstInstance = instances[0];

      if (!firstInstance || !firstInstance.id) {
        throw new Error("Nenhuma instância criada");
      }

      // Desconectar e reconectar
      const disconnectRes = await fetch(
        `/api/instances/${firstInstance.id}/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "disconnect" }),
        }
      );
      if (!disconnectRes.ok) throw new Error(`Status ${disconnectRes.status}`);

      // Aguardar um pouco antes de reconectar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reconnectRes = await fetch(
        `/api/instances/${firstInstance.id}/connect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "connect" }),
        }
      );
      if (!reconnectRes.ok) throw new Error(`Status ${reconnectRes.status}`);

      const json = (await reconnectRes.json()) as unknown;
      const j = json as Record<string, unknown>;
      const payload =
        j && typeof j === "object" && "instance" in j ? j.instance : json;
      const normalized = normalize(payload);
      console.debug(
        "[useInstanceManager] restart response:",
        json,
        "normalized:",
        normalized
      );
      if (mountedRef.current)
        setData((prev) => ({ ...(prev ?? {}), ...(normalized ?? {}) }));

      startShortPollUntilOnline();

      if (typeof notifySuccess === "function")
        notifySuccess("Reinício solicitado");
      setLoading(false);
      return normalized;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.debug("[useInstanceManager] restart error:", err);
      if (mountedRef.current) setError(message);
      if (typeof notifyError === "function")
        notifyError("Falha ao reiniciar instância");
      setLoading(false);
      return undefined;
    }
  }, [startShortPollUntilOnline]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar primeira instância
      const listRes = await fetch("/api/instances");
      if (!listRes.ok) throw new Error(`Status ${listRes.status}`);
      const listJson = (await listRes.json()) as Record<string, unknown>;
      const instances = (listJson.instances ?? []) as Array<{ id?: number }>;
      const firstInstance = instances[0];

      if (!firstInstance || !firstInstance.id) {
        throw new Error("Nenhuma instância criada");
      }

      // Desconectar primeira instância
      const res = await fetch(`/api/instances/${firstInstance.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as unknown;
      const j = json as Record<string, unknown>;
      const payload =
        j && typeof j === "object" && "instance" in j ? j.instance : json;
      const normalized = normalize(payload);
      console.debug(
        "[useInstanceManager] disconnect response:",
        json,
        "normalized:",
        normalized
      );
      stopShortPoll();
      if (mountedRef.current) setData(normalized ?? undefined);
      if (typeof notifySuccess === "function")
        notifySuccess("Instância desconectada");
      setLoading(false);
      return normalized;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.debug("[useInstanceManager] disconnect error:", err);
      if (mountedRef.current) setError(message);
      if (typeof notifyError === "function")
        notifyError("Falha ao desconectar instância");
      setLoading(false);
      return undefined;
    }
  }, [stopShortPoll]);

  useEffect(() => {
    const ac = new AbortController();
    void fetchStatus(ac.signal);
    return () => ac.abort();
  }, [fetchStatus]);

  return {
    data,
    loading,
    error,
    fetchStatus,
    connect,
    restart,
    disconnect,
    stopShortPoll,
  } as const;
}
