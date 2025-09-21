import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StickyNote, Search, Moon, Sun, ChevronDown, LogOut, User, Settings, Menu, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import Sidebar from "@/components/sidebar";
import NoteList from "@/components/note-list";
import Editor from "@/components/editor";

export default function Dashboard() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>();
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialView, setSpecialView] = useState<'pinned' | 'recent' | 'favorites'>();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [mobileView, setMobileView] = useState<'folders' | 'notes' | 'editor'>('folders');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleFolderSelect = (folderId?: string) => {
    setSelectedFolderId(folderId);
    setSpecialView(undefined);
    setSelectedNoteId(undefined);
    setSearchQuery("");
  };

  const handleSpecialSelect = (type: 'pinned' | 'recent' | 'favorites') => {
    setSpecialView(type);
    setSelectedFolderId(undefined);
    setSelectedNoteId(undefined);
    setSearchQuery("");
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const handleNewNote = () => {
    setSelectedNoteId(undefined);
  };

  const handleNoteCreated = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const handleNoteDeleted = () => {
    setSelectedNoteId(undefined);
    // On mobile, navigate back to notes list after deletion
    if (window.innerWidth < 1024) {
      setMobileView('notes');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedFolderId(undefined);
    setSpecialView(undefined);
    setSelectedNoteId(undefined);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userInitials = user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileView('folders')}
            className="lg:hidden p-2"
            data-testid="button-mobile-menu"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <StickyNote className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold hidden sm:block">NoteKeep</h1>
            <h1 className="text-base font-semibold sm:hidden">NK</h1>
            <span className="text-xs bg-secondary text-secondary-foreground px-1 sm:px-2 py-1 rounded hidden sm:inline">
              MinimalAuth
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 lg:w-64"
              data-testid="input-search-notes"
            />
          </div>
          
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden p-2"
            data-testid="button-search-mobile"
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            data-testid="button-toggle-theme"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2" data-testid="button-user-menu">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:inline">{user?.username}</span>
                <ChevronDown className="h-3 w-3 hidden sm:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="menu-profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="bg-card border-b border-border px-3 py-2 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full"
              data-testid="input-search-mobile"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1">
          <Sidebar
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
            onSpecialSelect={handleSpecialSelect}
            onNewNote={handleNewNote}
          />
          
          <NoteList
            selectedNoteId={selectedNoteId}
            selectedFolderId={selectedFolderId}
            searchQuery={searchQuery}
            specialView={specialView}
            onNoteSelect={handleNoteSelect}
          />
          
          <Editor
            noteId={selectedNoteId}
            onNoteCreated={handleNoteCreated}
            onNoteDeleted={handleNoteDeleted}
          />
        </div>
        
        {/* Mobile Layout */}
        <div className="flex-1 lg:hidden">
          {/* Mobile Sidebar */}
          {mobileView === 'folders' && (
            <div className="h-full">
              <div className="p-3 border-b">
                <h2 className="font-semibold text-lg">Folders & Notes</h2>
              </div>
              <Sidebar
                selectedFolderId={selectedFolderId}
                onFolderSelect={(folderId) => {
                  handleFolderSelect(folderId);
                  setMobileView('notes');
                }}
                onSpecialSelect={(type) => {
                  handleSpecialSelect(type);
                  setMobileView('notes');
                }}
                onNewNote={() => {
                  handleNewNote();
                  setMobileView('editor');
                }}
              />
            </div>
          )}
          
          {/* Mobile Note List */}
          {mobileView === 'notes' && (
            <div className="h-full">
              <div className="p-3 border-b flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMobileView('folders')}
                  className="p-1"
                  aria-label="Back to folders"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-lg">Notes</h2>
              </div>
              <NoteList
                selectedNoteId={selectedNoteId}
                selectedFolderId={selectedFolderId}
                searchQuery={searchQuery}
                specialView={specialView}
                onNoteSelect={(noteId) => {
                  handleNoteSelect(noteId);
                  setMobileView('editor');
                }}
              />
            </div>
          )}
          
          {/* Mobile Editor */}
          {mobileView === 'editor' && (
            <div className="h-full">
              <div className="p-3 border-b flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMobileView('notes')}
                  className="p-1"
                  aria-label="Back to notes"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-lg">Editor</h2>
              </div>
              <Editor
                noteId={selectedNoteId}
                onNoteCreated={handleNoteCreated}
                onNoteDeleted={handleNoteDeleted}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
