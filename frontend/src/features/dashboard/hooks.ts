import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Checkin,
  Paginated,
  Recommendation,
  Workout,
  WorkoutSession,
  Goal,
} from "@/lib/types";

export function useCheckins() {
  return useQuery({
    queryKey: ["checkins"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Checkin>>("/fitness/checkins/", {
        params: { ordering: "date" },
      });
      return data.results;
    },
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const { data } = await api.get<{ streak: number }>("/fitness/checkins/streak/");
      return data.streak;
    },
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const { data } = await api.get<{ recommendations: Recommendation[] }>(
        "/coach/recommendations/"
      );
      return data.recommendations;
    },
  });
}

export function useWorkouts() {
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Workout>>("/fitness/workouts/");
      return data.results;
    },
  });
}

export function useSessions(status?: string) {
  return useQuery({
    queryKey: ["sessions", status],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WorkoutSession>>("/fitness/sessions/", {
        params: status ? { status } : undefined,
      });
      return data.results;
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Goal>>("/fitness/goals/");
      return data.results;
    },
  });
}
