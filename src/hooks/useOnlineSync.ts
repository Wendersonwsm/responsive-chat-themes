import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Revalida automaticamente todas as queries quando o navegador volta a ficar online.
 * Mostra um toast de sincronização em andamento e, ao concluir, um toast de sucesso.
 */
export function useOnlineSync() {
  const qc = useQueryClient();
  const wasOffline = useRef(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = async () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      const id = toast.loading("Sincronizando dados...");
      try {
        await qc.invalidateQueries();
        await qc.refetchQueries({ type: "active" });
        toast.success("Sincronização concluída", { id });
      } catch {
        toast.error("Falha ao sincronizar. Tente novamente.", { id });
      }
    };
    const handleOffline = () => {
      wasOffline.current = true;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [qc]);
}
