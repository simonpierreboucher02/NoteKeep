import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  Download, 
  Eye, 
  Pin, 
  Plus, 
  X, 
  Trash2,
  FileText,
  FileDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Folder } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { countWords, estimateReadingTime } from "@/lib/markdown";
import { exportAsMarkdown, exportAsText, exportAsPDF } from "@/lib/export";
import { useNote, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";
import MarkdownPreview from "./markdown-preview";

interface NoteEditorProps {
  noteId?: string;
  onNoteCreated?: (noteId: string) => void;
  onNoteDeleted?: () => void;
}

export default function NoteEditor({ noteId, onNoteCreated, onNoteDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isNewNote, setIsNewNote] = useState(false);
  
  const { toast } = useToast();

  const { data: note, isLoading } = useNote(noteId);
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ['/api/folders'],
  });

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setIsPinned(note.isPinned);
      setSelectedFolderId(note.folderId || "");
      setIsNewNote(false);
    } else if (!noteId) {
      // New note mode
      setTitle("");
      setContent("");
      setTags([]);
      setIsPinned(false);
      setSelectedFolderId("");
      setIsNewNote(true);
    }
  }, [note, noteId]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    const noteData = {
      title,
      content,
      tags,
      isPinned,
      folderId: selectedFolderId || null,
    };

    if (isNewNote) {
      createNoteMutation.mutate(noteData, {
        onSuccess: (newNote) => {
          setIsNewNote(false);
          onNoteCreated?.(newNote.id);
        },
      });
    } else if (noteId) {
      updateNoteMutation.mutate({ ...noteData, id: noteId });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleExport = (format: 'markdown' | 'text' | 'pdf') => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Nothing to export",
        description: "Please add some content before exporting",
        variant: "destructive",
      });
      return;
    }

    switch (format) {
      case 'markdown':
        exportAsMarkdown(title, content);
        break;
      case 'text':
        exportAsText(title, content);
        break;
      case 'pdf':
        exportAsPDF(title, content);
        break;
    }
    
    toast({ title: `Exported as ${format.toUpperCase()}` });
  };

  const handleDelete = () => {
    if (noteId && !isNewNote) {
      deleteNoteMutation.mutate(noteId, {
        onSuccess: () => {
          onNoteDeleted?.();
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading note...</div>
      </div>
    );
  }

  const wordCount = countWords(content);
  const readingTime = estimateReadingTime(content);

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0"
              data-testid="input-note-title"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className={isPinned ? "text-primary" : "text-muted-foreground"}
              data-testid="button-pin-note"
            >
              <Pin className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              data-testid="button-toggle-preview"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Editor' : 'Preview'}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-export-options">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('markdown')}
                    data-testid="button-export-markdown"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Markdown (.md)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('text')}
                    data-testid="button-export-text"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Text (.txt)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('pdf')}
                    data-testid="button-export-pdf"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF (.pdf)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={handleSave}
              disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              data-testid="button-save-note"
            >
              <Save className="h-4 w-4 mr-1" />
              {createNoteMutation.isPending || updateNoteMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            
            {!isNewNote && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteNoteMutation.isPending}
                data-testid="button-delete-note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Tags and Meta Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor="folder-select" className="text-sm">Folder:</Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="w-48" data-testid="select-folder">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.filter((folder: any) => folder.id && folder.id.trim() && folder.name).map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.emoji && `${folder.emoji} `}{folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                    data-testid={`remove-tag-${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              
              <div className="flex items-center space-x-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag"
                  className="w-20 h-6 text-xs"
                  data-testid="input-new-tag"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTag}
                  className="h-6 px-2"
                  data-testid="button-add-tag"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {note && (
              <>
                Last modified {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })} • 
              </>
            )}
            {wordCount} words • {readingTime} min read
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex">
        {showPreview ? (
          <MarkdownPreview content={content} />
        ) : (
          <div className="flex-1 flex">
            {/* Markdown Editor */}
            <div className="flex-1 flex flex-col border-r border-border">
              <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                Markdown Editor
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing in Markdown..."
                className="flex-1 border-none resize-none focus:ring-0 font-mono text-sm leading-relaxed p-6 scrollbar-thin"
                data-testid="textarea-note-content"
              />
            </div>
            
            {/* Live Preview */}
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
