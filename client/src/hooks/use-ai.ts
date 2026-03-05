import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

interface ChatPayload {
  message: string;
  personality?: string;
  articleContextId?: number;
}

export function useAIChat() {
  return useMutation({
    mutationFn: async (payload: ChatPayload) => {
      const res = await fetch(api.ai.chat.path, {
        method: api.ai.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      return data as { reply: string };
    },
  });
}
