import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { queryClient } from "@/lib/queryClient";
import { useLenis } from "@/lib/useLenis";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const initTheme = useThemeStore((s) => s.init);
  useLenis();

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [fetchMe, initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
