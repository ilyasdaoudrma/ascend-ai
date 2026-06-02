import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export function useCoachChat() {
  return useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      const { data } = await api.post<{ reply: string; provider: string }>("/coach/chat/", {
        message,
        history,
      });
      return data;
    },
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: async () => {
      await api.post("/coach/subscribe/");
    },
  });
}
