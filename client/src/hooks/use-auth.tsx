import { useAuth as useAuthContext } from "@/components/auth-provider";

// Re-export the auth hook from the auth provider for convenience
export const useAuth = useAuthContext;
