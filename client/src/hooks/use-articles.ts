import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type ArticleResponse, type InsertArticle } from "@shared/schema";
import { z } from "zod";

export function useArticles(filters?: { category?: string; isFeatured?: string; trending?: string; search?: string }) {
  return useQuery({
    queryKey: [api.articles.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.articles.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      
      // We know from schema it returns ArticleResponse[]
      const data = await res.json();
      return data as ArticleResponse[];
    },
  });
}

export function useArticle(idOrSlug: string | number) {
  return useQuery({
    queryKey: [api.articles.get.path, idOrSlug],
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { id: idOrSlug });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      return (await res.json()) as ArticleResponse;
    },
    enabled: !!idOrSlug,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertArticle) => {
      const res = await fetch(api.articles.create.path, {
        method: api.articles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create article");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertArticle>) => {
      const url = buildUrl(api.articles.update.path, { id });
      const res = await fetch(url, {
        method: api.articles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update article");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, variables.id] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.delete.path, { id });
      const res = await fetch(url, {
        method: api.articles.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete article");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useIncrementView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.incrementView.path, { id });
      const res = await fetch(url, {
        method: api.articles.incrementView.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to increment view");
      return await res.json();
    },
    // We might not want to aggressively invalidate list here to avoid flicker,
    // but we can invalidate the specific article
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, id] });
    }
  });
}
