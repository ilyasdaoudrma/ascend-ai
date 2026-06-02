import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminUser, Paginated } from "@/lib/types";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () =>
      (await api.get("/auth/admin/users/stats/")).data as {
        total_users: number;
        active_today: number;
        banned: number;
        staff: number;
        total_posts: number;
        total_workouts: number;
      },
  });
}

export function useAdminUsers(search: string) {
  return useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AdminUser>>("/auth/admin/users/", {
        params: search ? { search } : undefined,
      });
      return data.results;
    },
  });
}

export function useAdminActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };
  return {
    ban: useMutation({
      mutationFn: async ({ id, days, reason }: { id: number; days: number; reason: string }) =>
        api.post(`/auth/admin/users/${id}/ban/`, { days, reason }),
      onSuccess: invalidate,
    }),
    unban: useMutation({
      mutationFn: async (id: number) => api.post(`/auth/admin/users/${id}/unban/`),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: number) => api.delete(`/auth/admin/users/${id}/`),
      onSuccess: invalidate,
    }),
  };
}
