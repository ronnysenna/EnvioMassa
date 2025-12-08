import { useCallback, useEffect, useRef, useState } from "react";

export interface InstanceData {
  instancia: string | null;
  status: string | null;
  qrCode: string | null;
  lastUpdate: string | null;
  connecting: boolean;
}

export function useInstanceStatus(pollMs = 5000) {
  const mountedRef = useRef(true);
  const [data, setData] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalize = useCallback((raw: unknown): InstanceData | null => {
    if (raw == null) return null;
    let candidate: unknown = raw;
    if (Array.isArray(candidate) && candidate.length) candidate = candidate[0];
    if (candidate && typeof candidate === "object") {
      const c = candidate as Record<string, unknown>;
      if (Array.isArray(c.data) && c.data.length) candidate = c.data[0];
    }
    if (!candidate || typeof candidate !== "object") return null;
    const r = candidate as Record<string, unknown>;

    const statusRaw = (r.connectionStatus ??
      r.status ??
      r.state ??
      r.statusText ??
      r.connectionstatus) as string | undefined | null;

    let mappedStatus: string | null = null;
    if (statusRaw !== undefined && statusRaw !== null) {
      const cleaned = String(statusRaw)
        .replace(/{{\s*|\s*}}/g, "")
        .trim()
        .toLowerCase();
      if (cleaned === "open" || cleaned === "online" || cleaned === "connected")
        mappedStatus = "online";
      else if (
        cleaned === "closed" ||
        cleaned === "offline" ||
        cleaned === "disconnected"
      )
        mappedStatus = "offline";
      else if (cleaned === "connecting" || cleaned === "pending")
        mappedStatus = "connecting";
      else mappedStatus = cleaned;
    }

    return {
      instancia: (r.instancia ?? r.name ?? null) as string | null,
      status: mappedStatus,
      qrCode: (r.qrCode ?? r.qr ?? r.qrcode ?? null) as string | null,
      lastUpdate: (r.lastUpdate ?? r.updatedAt ?? null) as string | null,
      connecting: !!r.connecting,
    } as InstanceData;
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!mountedRef.current) return null;
    if (mountedRef.current) setLoading(true);
    try {
      // Buscar primeira instância
      const listRes = await fetch("/api/instances", { method: "GET" });
      if (!listRes.ok) {
        const err = await listRes.json().catch(() => ({}));
        if (mountedRef.current)
          setError(err?.error ?? "Erro ao buscar instâncias");
        return null;
      }
      const listJson = (await listRes.json()) as Record<string, unknown>;
      const instances = (listJson.instances ?? []) as Array<{ id?: number }>;
      const firstInstance = instances[0];

      if (!firstInstance || !firstInstance.id) {
        // Nenhuma instância
        if (mountedRef.current) {
          setData(null);
          setError(null);
        }
        return null;
      }

      // Buscar status da primeira instância
      const res = await fetch(`/api/instances/${firstInstance.id}`, {
        method: "GET",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (mountedRef.current) setError(err?.error ?? "Erro ao buscar status");
        return null;
      }
      const json = await res.json().catch(() => ({}));
      // debug logs
      // eslint-disable-next-line no-console
      console.debug("[useInstanceStatus] raw:", json);
      const normalized = normalize(
        json?.instance ?? json?.data ?? json ?? null
      );
      if (mountedRef.current) {
        setData(normalized);
        setError(null);
        // eslint-disable-next-line no-console
        console.debug("[useInstanceStatus] normalized:", normalized);
      }
      return normalized;
    } catch (err) {
      if (mountedRef.current) setError("Erro ao buscar status");
      // eslint-disable-next-line no-console
      console.error("useInstanceStatus fetch error", err);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [normalize]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    const id = window.setInterval(fetchStatus, pollMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchStatus, pollMs]);

  return { data, loading, error, refetch: fetchStatus };
}
