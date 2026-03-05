import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CommentWithUser, Reaction } from "@shared/schema";

export function useComments(articleId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, articleId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { articleId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return (await res.json()) as CommentWithUser[];
    },
    enabled: !!articleId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ articleId, content }: { articleId: number; content: string }) => {
      const url = buildUrl(api.comments.create.path, { articleId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, variables.articleId] });
    },
  });
}

export function useReactions(articleId: number) {
  return useQuery({
    queryKey: [api.reactions.list.path, articleId],
    queryFn: async () => {
      const url = buildUrl(api.reactions.list.path, { articleId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reactions");
      return (await res.json()) as Reaction[];
    },
    enabled: !!articleId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ articleId, type }: { articleId: number; type: string }) => {
      const url = buildUrl(api.reactions.toggle.path, { articleId });
      const res = await fetch(url, {
        method: api.reactions.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle reaction");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.reactions.list.path, variables.articleId] });
    },
  });
}
