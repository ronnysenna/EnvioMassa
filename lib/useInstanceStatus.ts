import { useEffect, useState } from "react";

export interface InstanceStatus {
  instancia?: string;
  status: "open" | "closed" | "offline" | "error" | string;
  lastUpdate?: Date | null;
  message?: string;
}

export function useInstanceStatus() {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const checkInstanceStatus = async () => {
      try {
        // Buscar status do endpoint local /api/instance/webhook
        const res = await fetch("/api/instance/webhook", {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          const instanceData = data.data;

          // Converter "open" → "online", "closed" → "offline"
          const normalizedStatus = {
            ...instanceData,
            status:
              instanceData.status === "open"
                ? "online"
                : instanceData.status === "closed"
                ? "offline"
                : instanceData.status,
          };

          setStatus(normalizedStatus);
        } else {
          setStatus({
            status: "offline",
            message: "Instância não respondeu",
          });
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error checking instance status:", error);
        setStatus({
          status: "offline",
          message: "Erro ao conectar",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkInstanceStatus();

    // Verificar status a cada 30 segundos
    interval = setInterval(checkInstanceStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { status, loading };
}
