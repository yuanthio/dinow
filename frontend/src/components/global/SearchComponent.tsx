"use client";

import { useState, useEffect, useRef } from "react";
import { Search, LayoutGrid, Columns, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EditCardDialog from "@/components/board/EditCardDialog";

interface SearchResult {
  boards: Array<{
    id: number;
    name: string;
    category: string;
    members: Array<{ role: string }>;
  }>;
  columns: Array<{
    id: number;
    title: string;
    boardId: number;
    board: { name: string };
  }>;
  cards: Array<{
    id: number;
    title: string;
    description: string | null;
    boardId: number;
    columnId: number;
    board: { name: string };
  }>;
}

const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // State for edit card dialog
  const [showEditCardDialog, setShowEditCardDialog] = useState<number | null>(null);
  const [editCardData, setEditCardData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [editCardImageUrl, setEditCardImageUrl] = useState<string | null>(null);
  const [uploadingCardImage, setUploadingCardImage] = useState(false);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (type: string, id: number, boardId?: number, cardData?: any) => {
    if (type === "board") {
      router.push(`/board/${id}`);
    } else if (type === "column") {
      router.push(`/board/${boardId}`);
    } else if (type === "card") {
      // Store card data in localStorage for board page to access
      if (boardId && cardData) {
        const cardToEdit = {
          id: cardData.id,
          title: cardData.title,
          description: cardData.description || "",
          imageUrl: cardData.imageUrl || null,
          boardId: boardId
        };
        localStorage.setItem('cardToEdit', JSON.stringify(cardToEdit));
        
        // Navigate to board with edit card flag
        router.push(`/board/${boardId}?editCard=${cardData.id}`);
      }
    }
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const fetchChecklistItems = async (cardId: number) => {
    try {
      const response = await api.get(`/boards/${cardId}/cards/${cardId}/checklist`);
      setChecklistItems(response.data || []);
    } catch (error) {
      console.error("Failed to fetch checklist items:", error);
      setChecklistItems([]);
    }
  };

  const handleUpdateCard = async () => {
    if (!showEditCardDialog) return;
    
    try {
      await api.put(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}`, {
        title: editCardData.title,
        description: editCardData.description
      });
      
      // Close dialog and reset state
      setShowEditCardDialog(null);
      setEditCardData({ title: "", description: "" });
      setEditCardImageUrl(null);
      setChecklistItems([]);
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const handleUploadCardImage = async (file: File) => {
    if (!showEditCardDialog) return;
    setUploadingCardImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setEditCardImageUrl(response.data.imageUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploadingCardImage(false);
    }
  };

  const handleRemoveCardImage = async () => {
    if (!showEditCardDialog) return;
    try {
      await api.delete(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/image`);
      setEditCardImageUrl(null);
    } catch (error) {
      console.error("Failed to remove image:", error);
    }
  };

  const handleChecklistToggle = async (itemId: number) => {
    if (!showEditCardDialog) return;
    try {
      const item = checklistItems.find(item => item.id === itemId);
      if (item) {
        await api.put(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/checklist/${itemId}`, {
          completed: !item.completed
        });
        
        setChecklistItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
    }
  };

  const handleChecklistUpdate = async (itemId: number, text: string) => {
    if (!showEditCardDialog) return;
    try {
      await api.put(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/checklist/${itemId}`, {
        text
      });
      
      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, text } : item
        )
      );
    } catch (error) {
      console.error("Failed to update checklist item:", error);
    }
  };

  const handleChecklistDelete = async (itemId: number) => {
    if (!showEditCardDialog) return;
    try {
      await api.delete(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/checklist/${itemId}`);
      
      setChecklistItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
    }
  };

  const handleChecklistCreate = async (text: string) => {
    if (!showEditCardDialog) return;
    try {
      const response = await api.post(`/boards/${showEditCardDialog}/cards/${showEditCardDialog}/checklist`, {
        text
      });
      
      setChecklistItems(prev => [...prev, response.data]);
    } catch (error) {
      console.error("Failed to create checklist item:", error);
    }
  };

  const getFallbackCoverClass = (seed: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-800'
    ];
    return colors[seed % colors.length];
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "board":
        return <Square className="w-4 h-4 text-blue-500" />;
      case "column":
        return <Columns className="w-4 h-4 text-green-500" />;
      case "card":
        return <LayoutGrid className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const hasResults = results && (
    results.boards.length > 0 ||
    results.columns.length > 0 ||
    results.cards.length > 0
  );

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search boards, columns, cards..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && query.length >= 3 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : hasResults ? (
            <div className="p-2">
              {/* Boards Section */}
              {results.boards.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Boards
                  </div>
                  {results.boards.map((board) => (
                    <div
                      key={`board-${board.id}`}
                      onClick={() => handleItemClick("board", board.id)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md transition-colors"
                    >
                      {getResultIcon("board")}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{board.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{board.category.toLowerCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Columns Section */}
              {results.columns.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Columns
                  </div>
                  {results.columns.map((column) => (
                    <div
                      key={`column-${column.id}`}
                      onClick={() => handleItemClick("column", column.id, column.boardId)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md transition-colors"
                    >
                      {getResultIcon("column")}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{column.title}</div>
                        <div className="text-sm text-gray-500">in {column.board.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cards Section */}
              {results.cards.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cards
                  </div>
                  {results.cards.map((card) => (
                    <div
                      key={`card-${card.id}`}
                      onClick={() => handleItemClick("card", card.id, card.boardId, card)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md transition-colors"
                    >
                      {getResultIcon("card")}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{card.title}</div>
                        <div className="text-sm text-gray-500">in {card.board.name}</div>
                        {card.description && (
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {card.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : query.length >= 3 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}

      {/* Edit Card Dialog */}
      {showEditCardDialog && (
        <EditCardDialog
          isOpen={!!showEditCardDialog}
          cardId={showEditCardDialog}
          cardData={editCardData}
          imageUrl={editCardImageUrl}
          checklistItems={checklistItems}
          uploadingImage={uploadingCardImage}
          apiOrigin="http://localhost:3000"
          getFallbackCoverClass={getFallbackCoverClass}
          onClose={() => {
            setShowEditCardDialog(null);
            setEditCardData({ title: "", description: "" });
            setEditCardImageUrl(null);
            setChecklistItems([]);
          }}
          onUpdate={handleUpdateCard}
          onTitleChange={(value) => setEditCardData(prev => ({ ...prev, title: value }))}
          onDescriptionChange={(value) => setEditCardData(prev => ({ ...prev, description: value }))}
          onImageUpload={handleUploadCardImage}
          onImageRemove={handleRemoveCardImage}
          onChecklistToggle={handleChecklistToggle}
          onChecklistUpdate={handleChecklistUpdate}
          onChecklistDelete={handleChecklistDelete}
          onChecklistCreate={handleChecklistCreate}
          onChecklistDragStart={() => {}}
          onChecklistDragEnd={() => {}}
          onChecklistDrop={() => {}}
        />
      )}
    </div>
  );
};

export default SearchComponent;
