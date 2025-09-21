import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pin, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Note, Folder } from "@shared/schema";

interface NoteListProps {
  selectedNoteId?: string;
  selectedFolderId?: string;
  searchQuery?: string;
  specialView?: 'pinned' | 'recent' | 'favorites';
  onNoteSelect: (noteId: string) => void;
}

export default function NoteList({ 
  selectedNoteId, 
  selectedFolderId, 
  searchQuery, 
  specialView,
  onNoteSelect 
}: NoteListProps) {
  
  const buildQueryKey = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set('search', searchQuery);
    } else if (specialView === 'pinned') {
      params.set('pinned', 'true');
    } else if (selectedFolderId) {
      params.set('folderId', selectedFolderId);
    }
    
    const queryString = params.toString();
    return queryString ? `/api/notes?${queryString}` : '/api/notes';
  };

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: [buildQueryKey()],
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ['/api/folders'],
  });

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    const folder = folders.find((f: any) => f.id === folderId);
    return folder ? `${folder.emoji ? folder.emoji + ' ' : ''}${folder.name}` : 'Unknown Folder';
  };

  const getHeaderTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (specialView === 'pinned') return 'Pinned Notes';
    if (specialView === 'recent') return 'Recent Notes';
    if (specialView === 'favorites') return 'Favorite Notes';
    if (selectedFolderId) return getFolderName(selectedFolderId);
    return 'All Notes';
  };

  const extractPreview = (content: string): string => {
    // Remove markdown syntax for preview
    return content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .substring(0, 150);
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-card border-r border-border flex items-center justify-center">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground truncate">{getHeaderTitle()}</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-sort-notes">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No notes found.</p>
            {searchQuery && (
              <p className="text-xs mt-2">Try a different search term.</p>
            )}
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onNoteSelect(note.id)}
              className={`p-4 border-b border-border cursor-pointer transition-colors ${
                selectedNoteId === note.id ? 'bg-accent' : 'hover:bg-accent'
              }`}
              data-testid={`note-${note.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {note.isPinned && (
                    <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                  <h3 className="font-medium text-foreground truncate">
                    {note.title}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {extractPreview(note.content)}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs"
                      data-testid={`tag-${tag}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{note.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {note.wordCount} words
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
