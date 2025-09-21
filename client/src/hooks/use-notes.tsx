import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote, UpdateNote } from "@shared/schema";

export function useNotes(options?: {
  folderId?: string;
  search?: string;
  pinned?: boolean;
}) {
  const buildQueryKey = () => {
    const params = new URLSearchParams();
    
    if (options?.search) {
      params.set('search', options.search);
    } else if (options?.pinned) {
      params.set('pinned', 'true');
    } else if (options?.folderId) {
      params.set('folderId', options.folderId);
    }
    
    const queryString = params.toString();
    return queryString ? `/api/notes?${queryString}` : '/api/notes';
  };

  return useQuery<Note[]>({
    queryKey: [buildQueryKey()],
  });
}

export function useNote(id?: string) {
  return useQuery<Note>({
    queryKey: ['/api/notes', id],
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteData: InsertNote) => {
      const res = await apiRequest('POST', '/api/notes', noteData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: "Note created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create note",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteData: UpdateNote) => {
      const res = await apiRequest('PUT', `/api/notes/${noteData.id}`, noteData);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes', variables.id] });
      toast({ title: "Note saved successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to save note",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: "Note deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete note",
        variant: "destructive",
      });
    },
  });
}

export function usePinNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await apiRequest('PUT', `/api/notes/${id}`, { isPinned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: "Note pin status updated" });
    },
    onError: () => {
      toast({
        title: "Failed to update note",
        variant: "destructive",
      });
    },
  });
}
