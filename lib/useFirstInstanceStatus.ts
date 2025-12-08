"use client";

import { useEffect, useState } from "react";

interface Instance {
  id: number;
  instanceName: string;
  status: string;
}

export function useFirstInstanceStatus() {
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const res = await fetch("/api/instances");
        if (res.ok) {
          const data = await res.json();
          const instances = data.instances || [];
          if (instances.length > 0) {
            setInstance(instances[0]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar instância:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstance();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchInstance, 10000);
    return () => clearInterval(interval);
  }, []);

  return { instance, loading };
}
