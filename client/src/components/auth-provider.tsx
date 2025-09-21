import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User;
  encryptionKey: string;
}

interface RegisterResponse extends AuthResponse {
  recoveryKey: string;
}

interface AuthContextType {
  user: User | null;
  encryptionKey: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<{ recoveryKey: string }>;
  logout: () => Promise<void>;
  recover: (username: string, recoveryKey: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [encryptionKey, setEncryptionKey] = useState<string | null>(
    localStorage.getItem('notekeeper_encryption_key')
  );
  const queryClient = useQueryClient();

  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/me'],
    enabled: true,
    retry: false,
  });

  const user = authData?.user || null;

  useEffect(() => {
    if (authData?.encryptionKey) {
      setEncryptionKey(authData.encryptionKey);
      localStorage.setItem('notekeeper_encryption_key', authData.encryptionKey);
    }
  }, [authData]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      setEncryptionKey(data.encryptionKey);
      localStorage.setItem('notekeeper_encryption_key', data.encryptionKey);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/register', { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      setEncryptionKey(data.encryptionKey);
      localStorage.setItem('notekeeper_encryption_key', data.encryptionKey);
      // Don't invalidate queries yet - wait until recovery key flow is complete
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      setEncryptionKey(null);
      localStorage.removeItem('notekeeper_encryption_key');
      queryClient.clear();
    },
  });

  const recoverMutation = useMutation({
    mutationFn: async ({ username, recoveryKey, newPassword }: { username: string; recoveryKey: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/recover', { username, recoveryKey, newPassword });
      return res.json();
    },
    onSuccess: (data) => {
      setEncryptionKey(data.encryptionKey);
      localStorage.setItem('notekeeper_encryption_key', data.encryptionKey);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (username: string, password: string) => {
    const result = await registerMutation.mutateAsync({ username, password });
    return { recoveryKey: result.recoveryKey };
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const recover = async (username: string, recoveryKey: string, newPassword: string) => {
    await recoverMutation.mutateAsync({ username, recoveryKey, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        encryptionKey,
        isLoading,
        login,
        register,
        logout,
        recover,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
