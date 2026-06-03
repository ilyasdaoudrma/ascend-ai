import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Paginated,
  Post,
  Comment,
  SocialUser,
  SocialNotification,
  LeaderboardEntry,
  PublicProfile,
  Challenge,
  Friendship,
  ChatRoom,
  Message,
  Group,
  GroupMessage,
  ActivityEvent,
} from "@/lib/types";

export function useFeed(scope: "discover" | "following" = "discover") {
  return useQuery({
    queryKey: ["feed", scope],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Post>>("/social/posts/", {
        params: { scope },
      });
      return data.results;
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; post_type: string; image_url?: string }) => {
      const { data } = await api.post<Post>("/social/posts/", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const { data } = await api.post(`/social/posts/${postId}/like/`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useComments(postId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["comments", postId],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<Comment[]>(`/social/posts/${postId}/comments/`);
      return data;
    },
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<Comment>(`/social/posts/${postId}/comments/`, { content });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useSuggestedUsers() {
  return useQuery({
    queryKey: ["suggested-users"],
    queryFn: async () => {
      const { data } = await api.get<SocialUser[]>("/social/users/");
      return data;
    },
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, follow }: { username: string; follow: boolean }) => {
      if (follow) await api.post(`/social/users/${username}/follow/`);
      else await api.delete(`/social/users/${username}/follow/`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggested-users"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

export function useLeaderboard(category: "xp" | "streak" | "workouts") {
  return useQuery({
    queryKey: ["leaderboard", category],
    queryFn: async () => {
      const { data } = await api.get<{ entries: LeaderboardEntry[] }>("/social/leaderboard/", {
        params: { category },
      });
      return data.entries;
    },
  });
}

export function usePublicProfile(username?: string) {
  return useQuery({
    queryKey: ["public-profile", username],
    enabled: !!username,
    queryFn: async () => {
      const { data } = await api.get<PublicProfile>(`/social/users/${username}/`);
      return data;
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<SocialNotification>>("/social/notifications/");
      return data.results;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get<{ unread: number }>("/social/notifications/unread_count/");
      return data.unread;
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/social/notifications/mark_all_read/");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useChallenges() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Challenge>>("/social/challenges/");
      return data.results;
    },
  });
  const join = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/social/challenges/${id}/join/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });
  return { ...query, join };
}

// ---- Friends ----
export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async () => (await api.get<SocialUser[]>("/social/friends/")).data,
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => (await api.get<Friendship[]>("/social/friends/requests/")).data,
  });
}

export function useFriendActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["friends"] });
    qc.invalidateQueries({ queryKey: ["friend-requests"] });
    qc.invalidateQueries({ queryKey: ["suggested-users"] });
  };
  return {
    sendRequest: useMutation({
      mutationFn: async (username: string) =>
        api.post("/social/friends/request_friend/", { username }),
      onSuccess: invalidate,
    }),
    accept: useMutation({
      mutationFn: async (id: number) => api.post(`/social/friends/${id}/accept/`),
      onSuccess: invalidate,
    }),
    decline: useMutation({
      mutationFn: async (id: number) => api.post(`/social/friends/${id}/decline/`),
      onSuccess: invalidate,
    }),
  };
}

// ---- Messaging ----
export function useChatRooms() {
  return useQuery({
    queryKey: ["chat-rooms"],
    refetchInterval: 8000,
    queryFn: async () =>
      (await api.get<Paginated<ChatRoom>>("/social/chat/")).data.results,
  });
}

export function useChatMessages(roomId: number | null) {
  return useQuery({
    queryKey: ["chat-messages", roomId],
    enabled: roomId != null,
    refetchInterval: 4000,
    queryFn: async () =>
      (await api.get<Message[]>(`/social/chat/${roomId}/messages/`)).data,
  });
}

export function useSendMessage(roomId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<Message>(`/social/chat/${roomId}/messages/`, { content })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useOpenChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.post<ChatRoom>("/social/chat/open/", { username })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-rooms"] }),
  });
}

export function useChatUnread() {
  return useQuery({
    queryKey: ["chat-unread"],
    refetchInterval: 15000,
    queryFn: async () =>
      (await api.get<{ unread: number }>("/social/chat/unread_count/")).data.unread,
  });
}

// ---- Groups ----
export function useGroups() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get<Paginated<Group>>("/social/groups/")).data.results,
  });
  const toggle = useMutation({
    mutationFn: async ({ id, join }: { id: number; join: boolean }) =>
      api.post(`/social/groups/${id}/${join ? "join" : "leave"}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
  const create = useMutation({
    mutationFn: async (payload: { name: string; description: string }) =>
      api.post("/social/groups/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
  return { ...query, toggle, create };
}

export function useGroup(id: number | undefined) {
  return useQuery({
    queryKey: ["group", id],
    enabled: id != null,
    queryFn: async () => (await api.get<Group>(`/social/groups/${id}/`)).data,
  });
}

export function useGroupMessages(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["group-messages", id],
    enabled: enabled && id != null,
    refetchInterval: 5000,
    queryFn: async () =>
      (await api.get<GroupMessage[]>(`/social/groups/${id}/messages/`)).data,
  });
}

export function useSendGroupMessage(id: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<GroupMessage>(`/social/groups/${id}/messages/`, { content })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-messages", id] }),
  });
}

export function useGroupJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, join }: { id: number; join: boolean }) =>
      api.post(`/social/groups/${id}/${join ? "join" : "leave"}/`),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["group", id] });
      qc.invalidateQueries({ queryKey: ["group-messages", id] });
    },
  });
}

// ---- Activity feed ----
export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () =>
      (await api.get<Paginated<ActivityEvent>>("/social/activity/")).data.results,
  });
}
