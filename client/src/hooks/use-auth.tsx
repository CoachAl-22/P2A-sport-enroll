import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data: response, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: response?.user || null,
    isLoading,
    isAuthenticated: !!response?.user,
  };
}
