import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

const friendlyMessage = (error: unknown, fallback: string) => {
  if (isOffline()) {
    return "Você está offline. Verifique sua conexão e tente novamente.";
  }
  const msg = (error as any)?.message as string | undefined;
  if (msg && /failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Não foi possível conectar ao servidor. Tente novamente em instantes.";
  }
  return msg || fallback;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount) => (isOffline() ? false : failureCount < 2),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: false,
      networkMode: "offlineFirst",
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Avoid spamming if a previous successful response is shown
      if (query.state.data !== undefined) return;
      if ((query.meta as any)?.silent) return;
      toast.error(friendlyMessage(error, "Não foi possível carregar os dados."));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      const fallback = ((mutation.meta as any)?.errorMessage as string) || "Não foi possível concluir a ação.";
      toast.error(friendlyMessage(error, fallback));
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      const msg = (mutation.meta as any)?.successMessage as string | undefined;
      if (msg) toast.success(msg);
    },
  }),
});
