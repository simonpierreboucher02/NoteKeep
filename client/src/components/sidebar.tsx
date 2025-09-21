import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Pin, 
  Clock, 
  Star,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertFolderSchema } from "@shared/schema";
import type { Folder as FolderType, InsertFolder, Note } from "@shared/schema";

interface SidebarProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
  onSpecialSelect: (type: 'pinned' | 'recent' | 'favorites') => void;
  onNewNote: () => void;
}

export default function Sidebar({ selectedFolderId, onFolderSelect, onSpecialSelect, onNewNote }: SidebarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ['/api/folders'],
  });

  const { data: pinnedNotes = [] } = useQuery<Note[]>({
    queryKey: ['/api/notes?pinned=true'],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folder: InsertFolder) => {
      const res = await apiRequest('POST', '/api/folders', folder);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setShowNewFolder(false);
      toast({ title: "Folder created successfully" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      await apiRequest('DELETE', `/api/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      if (selectedFolderId) {
        onFolderSelect(undefined);
      }
      toast({ title: "Folder deleted successfully" });
    },
  });

  const form = useForm<InsertFolder>({
    resolver: zodResolver(insertFolderSchema),
    defaultValues: { name: "", emoji: "" },
  });

  const onCreateFolder = (data: InsertFolder) => {
    createFolderMutation.mutate(data);
  };

  type FolderWithChildren = FolderType & { children: FolderWithChildren[] };

  const buildFolderTree = (folders: FolderType[]): FolderWithChildren[] => {
    const tree: FolderWithChildren[] = [];
    const folderMap = new Map<string, FolderWithChildren>();

    // Create folder objects with children arrays
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderWithChildren);
        } else {
          tree.push(folderWithChildren);
        }
      } else {
        tree.push(folderWithChildren);
      }
    });

    return tree;
  };

  const renderFolder = (folder: FolderWithChildren, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    
    return (
      <div key={folder.id} className={`ml-${depth * 4}`}>
        <button
          onClick={() => onFolderSelect(folder.id)}
          className={`w-full text-left px-2 py-1 rounded-md transition-colors flex items-center space-x-2 text-sm group ${
            isSelected ? 'bg-accent' : 'hover:bg-accent'
          }`}
          data-testid={`folder-${folder.id}`}
        >
          {folder.children && folder.children.length > 0 ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">
            {folder.emoji && `${folder.emoji} `}{folder.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteFolderMutation.mutate(folder.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-destructive"
            data-testid={`delete-folder-${folder.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </button>
        {folder.children && folder.children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewNote}
          className="w-full"
          data-testid="button-new-note"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Quick Access */}
      <div className="p-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Quick Access
        </div>
        
        <button
          onClick={() => onSpecialSelect('pinned')}
          className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors flex items-center space-x-2"
          data-testid="button-pinned-notes"
        >
          <Pin className="h-4 w-4 text-primary" />
          <span className="text-sm">Pinned Notes</span>
          {pinnedNotes.length > 0 && (
            <span className="ml-auto text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {pinnedNotes.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => onSpecialSelect('recent')}
          className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors flex items-center space-x-2"
          data-testid="button-recent-notes"
        >
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Recent</span>
        </button>
        
        <button
          onClick={() => onSpecialSelect('favorites')}
          className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors flex items-center space-x-2"
          data-testid="button-favorite-notes"
        >
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">Favorites</span>
        </button>
      </div>

      {/* Folders */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          <span>Folders</span>
          <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
            <DialogTrigger asChild>
              <button 
                className="hover:text-foreground transition-colors"
                data-testid="button-add-folder"
              >
                <Plus className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onCreateFolder)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    {...form.register("name")}
                    placeholder="Enter folder name"
                    data-testid="input-folder-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-emoji">Emoji (optional)</Label>
                  <Input
                    id="folder-emoji"
                    {...form.register("emoji")}
                    placeholder="📚"
                    maxLength={2}
                    data-testid="input-folder-emoji"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createFolderMutation.isPending} data-testid="button-create-folder">
                    {createFolderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewFolder(false)}
                    data-testid="button-cancel-folder"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {buildFolderTree(folders).map(folder => renderFolder(folder))}
        </div>

        {folders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No folders yet. Create your first folder to organize your notes.
          </p>
        )}
      </div>
    </div>
  );
}
