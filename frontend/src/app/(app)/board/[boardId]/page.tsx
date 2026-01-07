// dinow/frontend/src/app/(app)/board/[boardId]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { socketService } from "@/lib/socket";

import {
  BoardHeader,
  ColumnList,
  EditCardDialog,
  CreateColumnDialog,
  DeleteConfirmationDialog,
  BoardToast,
  type BoardDetails,
  type Column,
  type Card,
  type ChecklistItem
} from "@/components/board";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = params.boardId as string;

  const [board, setBoard] = useState<BoardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk kolom
  const [columns, setColumns] = useState<Column[]>([]);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);

  // State untuk card
  const [showCardDialog, setShowCardDialog] = useState<number | null>(null);
  const [cardTitle, setCardTitle] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

  // State untuk edit card dialog
  const [showEditCardDialog, setShowEditCardDialog] = useState<number | null>(null);
  const [editCardData, setEditCardData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [editCardImageUrl, setEditCardImageUrl] = useState<string | null>(null);
  const [uploadingCardImage, setUploadingCardImage] = useState(false);

  // State untuk checklist
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [checklistItems, setChecklistItems] = useState<Record<number, ChecklistItem[]>>({});

  // State untuk drag & drop
  const [draggedCard, setDraggedCard] = useState<{ id: number; columnId: number } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<{ id: number; order: number } | null>(null);
  const [draggedChecklistItem, setDraggedChecklistItem] = useState<{ id: number; cardId: number } | null>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const openedCardFromQueryRef = useRef<number | null>(null);

  // State untuk real-time sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // State untuk dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);
  const [showChecklistDeleteDialog, setShowChecklistDeleteDialog] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<{ cardId: number; itemId: number } | null>(null);
  const [showCardDeleteDialog, setShowCardDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);

  // State untuk toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchBoardDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/boards/${boardId}`);
      console.log("Board data:", response.data);

      const boardData = {
        ...response.data,
        columns: response.data.columns || [],
        members: response.data.members || [],
      };

      // Get user ID from response or local storage
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserId(payload.userId);
        } catch (err) {
          console.error("Failed to parse token:", err);
        }
      }

      setBoard(boardData);
      setColumns(boardData.columns || []);

      // Initialize checklist items from database
      const checklistData: Record<number, ChecklistItem[]> = {};
      boardData.columns.forEach((column: Column) => {
        column.cards.forEach((card: Card) => {
          checklistData[card.id] = [];
        });
      });
      setChecklistItems(checklistData);

      // Fetch checklist items for all cards
      const fetchPromises = boardData.columns.flatMap((column: Column) =>
        column.cards.map((card: Card) => fetchChecklistItems(card.id))
      );

      try {
        await Promise.all(fetchPromises);
      } catch (error) {
        console.error("Failed to fetch some checklist items:", error);
      }

    } catch (error: any) {
      console.error("Failed to fetch board:", error);
      setError(error.response?.data?.error || "Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistItems = async (cardId: number) => {
    try {
      const response = await api.get(`/boards/${cardId}/items`);
      const items = response.data.items || [];

      setChecklistItems((prev) => ({
        ...prev,
        [cardId]: items.sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order),
      }));

      // Update card checklist progress
      setColumns((prevColumns) =>
        prevColumns.map((column) => ({
          ...column,
          cards: column.cards.map((card) =>
            card.id === cardId
              ? { ...card, checklist: response.data.progress }
              : card
          ),
        }))
      );

      return items;
    } catch (error) {
      console.error("Failed to fetch checklist items:", error);
      return [];
    }
  };

  const getApiOrigin = () => {
    const base = api.defaults.baseURL || "http://localhost:3000/api/v1";
    return base.replace(/\/api\/v1\/?$/, "");
  };

  const getFallbackCoverClass = (seed: number) => {
    const classes = [
      "bg-gradient-to-r from-indigo-500 to-purple-500",
      "bg-gradient-to-r from-sky-500 to-indigo-500",
      "bg-gradient-to-r from-emerald-500 to-teal-500",
      "bg-gradient-to-r from-amber-500 to-orange-500",
      "bg-gradient-to-r from-pink-500 to-rose-500",
      "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    ];
    return classes[Math.abs(seed) % classes.length];
  };

  useEffect(() => {
    const cardParam = searchParams.get("card");
    if (!cardParam) return;

    const cardId = parseInt(cardParam);
    if (Number.isNaN(cardId)) return;
    if (openedCardFromQueryRef.current === cardId) return;
    if (!columns || columns.length === 0) return;

    const foundCard = columns.flatMap((c) => c.cards || []).find((c) => c.id === cardId);
    if (!foundCard) return;

    openedCardFromQueryRef.current = cardId;
    handleOpenEditCardDialog(foundCard);
  }, [searchParams, columns]);

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails();
    }
  }, [boardId]);

  useEffect(() => {
    const editCardId = searchParams.get('editCard');
    if (editCardId && board) {
      // Check localStorage for card data
      const cardToEdit = localStorage.getItem('cardToEdit');
      if (cardToEdit) {
        try {
          const cardData = JSON.parse(cardToEdit);
          if (cardData.id === parseInt(editCardId)) {
            // Find the card in the board
            let foundCard: Card | null = null;
            for (const column of board.columns || []) {
              const card = column.cards.find(c => c.id === cardData.id);
              if (card) {
                foundCard = card;
                break;
              }
            }
            
            if (foundCard) {
              // Open edit dialog with the card data
              handleOpenEditCardDialog(foundCard);
              // Clear the localStorage and URL parameter
              localStorage.removeItem('cardToEdit');
              router.replace(`/board/${boardId}`);
            }
          }
        } catch (error) {
          console.error('Error parsing card data from localStorage:', error);
          localStorage.removeItem('cardToEdit');
        }
      }
    }
  }, [searchParams, board]);

  // ==================== WEBSOCKET SETUP ====================
  useEffect(() => {
    // Connect socket jika belum terkoneksi
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Join board room
    const numericBoardId = parseInt(boardId);
    if (!isNaN(numericBoardId)) {
      socketService.joinBoard(numericBoardId);
    }

    // Subscribe to board updates
    const unsubscribe = socketService.subscribeToBoard(
      parseInt(boardId),
      (type, data) => {
        console.log(`Real-time ${type} update:`, data);
        
        // Skip jika update berasal dari diri sendiri
        if (data.updatedBy === userId || data.movedBy === userId || data.changedBy === userId) {
          console.log("Skipping own update");
          return;
        }

        // Handle updates berdasarkan type
        switch (type) {
          case "card":
            handleRemoteCardUpdate(data);
            break;
          case "column":
            handleRemoteColumnUpdate(data);
            break;
          case "checklist":
            handleRemoteChecklistUpdate(data);
            break;
        }
      }
    );

    // Cleanup
    return () => {
      unsubscribe();
      socketService.leaveBoard(parseInt(boardId));
    };
  }, [boardId, userId]);

  // Handle remote card updates
  const handleRemoteCardUpdate = useCallback((data: any) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    switch (data.type) {
      case "MOVED":
        setColumns(prevColumns => {
          return prevColumns.map(column => {
            if (column.id === data.fromColumnId) {
              return {
                ...column,
                cards: column.cards
                  .filter(card => card.id !== data.cardId)
                  .map((card, index) => ({ ...card, order: index }))
              };
            }
            if (column.id === data.toColumnId && data.card) {
              const newCard = { 
                ...data.card, 
                columnId: data.toColumnId,
                order: data.newOrder 
              };
              const newCards = [...column.cards, newCard]
                .sort((a, b) => a.order - b.order)
                .map((card, index) => ({ ...card, order: index }));
              return { ...column, cards: newCards };
            }
            return column;
          });
        });
        break;
        
      case "CREATED":
        if (data.card) {
          setColumns(prevColumns => 
            prevColumns.map(column => 
              column.id === data.card.columnId 
                ? { ...column, cards: [...column.cards, data.card] }
                : column
            )
          );
        }
        break;
        
      case "UPDATED":
        if (data.card) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              cards: column.cards.map(card => 
                card.id === data.cardId ? { ...card, ...data.card } : card
              )
            }))
          );
        }
        break;
        
      case "DELETED":
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.filter(card => card.id !== data.cardId)
          }))
        );
        break;
    }
    
    setTimeout(() => setIsSyncing(false), 100);
  }, [isSyncing]);

  // Handle remote column updates
  const handleRemoteColumnUpdate = useCallback((data: any) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    switch (data.type) {
      case "MOVED":
        if (data.column) {
          setColumns(prevColumns => {
            const updatedColumns = prevColumns.map(col => 
              col.id === data.columnId ? { ...col, order: data.column.order } : col
            );
            return updatedColumns.sort((a, b) => a.order - b.order);
          });
        }
        break;
        
      case "CREATED":
        if (data.column) {
          setColumns(prev => [...prev, data.column]);
        }
        break;
        
      case "UPDATED":
        if (data.column) {
          setColumns(prevColumns => 
            prevColumns.map(column => 
              column.id === data.columnId 
                ? { ...column, title: data.column.title }
                : column
            )
          );
        }
        break;
        
      case "DELETED":
        setColumns(prevColumns => 
          prevColumns.filter(column => column.id !== data.columnId)
        );
        break;
    }
    
    setTimeout(() => setIsSyncing(false), 100);
  }, [isSyncing]);

  // Handle remote checklist updates
  const handleRemoteChecklistUpdate = useCallback((data: any) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    switch (data.type) {
      case "ITEM_CREATED":
        setChecklistItems(prev => ({
          ...prev,
          [data.cardId]: [...(prev[data.cardId] || []), data.item]
            .sort((a, b) => a.order - b.order)
        }));
        
        if (data.progress) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              cards: column.cards.map(card => 
                card.id === data.cardId ? { 
                  ...card, 
                  checklist: data.progress 
                } : card
              )
            }))
          );
        }
        break;
        
      case "ITEM_UPDATED":
      case "ITEM_TOGGLED":
        if (data.item) {
          setChecklistItems(prev => ({
            ...prev,
            [data.cardId]: (prev[data.cardId] || []).map(item => 
              item.id === data.itemId ? { ...item, ...data.item } : item
            ).sort((a, b) => a.order - b.order)
          }));
          
          if (data.progress) {
            setColumns(prevColumns => 
              prevColumns.map(column => ({
                ...column,
                cards: column.cards.map(card => 
                  card.id === data.cardId ? { 
                    ...card, 
                    checklist: data.progress 
                  } : card
                )
              }))
            );
          }
        }
        break;
        
      case "ITEM_DELETED":
        setChecklistItems(prev => ({
          ...prev,
          [data.cardId]: (prev[data.cardId] || []).filter(item => item.id !== data.itemId)
        }));
        
        if (data.progress) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              cards: column.cards.map(card => 
                card.id === data.cardId ? { 
                  ...card, 
                  checklist: data.progress 
                } : card
              )
            }))
          );
        }
        break;
        
      case "ITEMS_REORDERED":
        if (data.items) {
          const updatedItems = [...(checklistItems[data.cardId] || [])];
          data.items.forEach((newItem: any) => {
            const index = updatedItems.findIndex(item => item.id === newItem.id);
            if (index !== -1) {
              updatedItems[index].order = newItem.order;
            }
          });
          updatedItems.sort((a, b) => a.order - b.order);
          
          setChecklistItems(prev => ({
            ...prev,
            [data.cardId]: updatedItems
          }));
        }
        break;
    }
    
    setTimeout(() => setIsSyncing(false), 100);
  }, [isSyncing, checklistItems]);

  // ==================== COLUMN FUNCTIONS ====================
  const handleCreateColumn = async () => {
    if (!columnTitle.trim()) return;
    
    try {
      const response = await api.post(`/boards/${boardId}/columns`, {
        title: columnTitle
      });
      
      const newColumn = response.data.column || response.data;
      setColumns(prev => [...prev, newColumn]);
      
      socketService.emitColumnChange({
        boardId: parseInt(boardId),
        type: "CREATED",
        column: newColumn
      });
      
      setColumnTitle("");
      setShowColumnDialog(false);
      setToastMessage("Column successfully created!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Failed to create column:", error);
      alert(error.response?.data?.error || "Failed to create column");
    }
  };

  const handleEditColumnStart = (columnId: number, title: string) => {
    setEditingColumnId(columnId);
    setColumnTitle(title);
  };

  const handleEditColumnSave = async (columnId: number, title: string) => {
    if (!title.trim()) return;
    
    try {
      const response = await api.patch(`/boards/${boardId}/columns/${columnId}`, {
        title
      });
      
      const updatedColumn = response.data.column || response.data;
      setColumns(prevColumns => 
        prevColumns.map(column => 
          column.id === columnId 
            ? { ...column, title: updatedColumn.title }
            : column
        )
      );
      
      socketService.emitColumnChange({
        boardId: parseInt(boardId),
        type: "UPDATED",
        columnId,
        column: updatedColumn
      });
      
      setColumnTitle("");
      setEditingColumnId(null);
      setToastMessage("Column successfully updated!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Failed to update column:", error);
      alert(error.response?.data?.error || "Failed to update column");
    }
  };

  const handleEditColumnCancel = () => {
    setEditingColumnId(null);
    setColumnTitle("");
  };

  const handleDeleteColumn = (columnId: number) => {
    setColumnToDelete(columnId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    
    try {
      setColumns(prevColumns => 
        prevColumns.filter(column => column.id !== columnToDelete)
      );
      
      socketService.emitColumnChange({
        boardId: parseInt(boardId),
        type: "DELETED",
        columnId: columnToDelete
      });
      
      await api.delete(`/boards/${boardId}/columns/${columnToDelete}`);
      
      setToastMessage("Column successfully deleted!");
      setShowToast(true);
      setShowDeleteDialog(false);
      setColumnToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete column:", error);
      alert(error.response?.data?.error || "Failed to delete column");
    }
  };

  // ==================== CARD FUNCTIONS ====================
  const handleCreateCard = async (columnId: number) => {
    if (!cardTitle.trim()) return;
    
    const tempId = Date.now();
    const optimisticCard = {
      id: tempId,
      title: cardTitle,
      description: cardDescription || null,
      columnId: columnId,
      boardId: parseInt(boardId),
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: null,
      checklist: undefined
    };
    
    setColumns(prevColumns => 
      prevColumns.map(column => 
        column.id === columnId 
          ? { ...column, cards: [...column.cards, optimisticCard] }
          : column
      )
    );
    
    setCardTitle("");
    setCardDescription("");
    setShowCardDialog(null);
    
    try {
      const response = await api.post(`/boards/${boardId}/cards`, {
        columnId: columnId,
        title: cardTitle,
        description: cardDescription || undefined
      });
      
      const realCard = response.data.card || response.data;
      setColumns(prevColumns => 
        prevColumns.map(column => 
          column.id === columnId 
            ? { 
                ...column, 
                cards: column.cards.map(card => 
                  card.id === tempId ? realCard : card
                )
              }
            : column
        )
      );
      
      socketService.emitCardChange({
        boardId: parseInt(boardId),
        type: "CREATED",
        card: realCard
      });
      
      setToastMessage("Card successfully created!");
      setShowToast(true);
      
    } catch (error: any) {
      setColumns(prevColumns => 
        prevColumns.map(column => 
          column.id === columnId 
            ? { ...column, cards: column.cards.filter(card => card.id !== tempId) }
            : column
        )
      );
      
      console.error("Failed to create card:", error);
      alert(error.response?.data?.error || "Failed to create card");
      setShowCardDialog(columnId);
      setCardTitle(cardTitle);
      setCardDescription(cardDescription);
    }
  };

  const handleOpenEditCardDialog = (card: Card) => {
    setEditCardData({
      title: card.title,
      description: card.description || ""
    });
    setEditCardImageUrl(card.imageUrl || null);
    setShowEditCardDialog(card.id);
    if (!checklistItems[card.id] || checklistItems[card.id].length === 0) {
      fetchChecklistItems(card.id);
    }
  };

  const handleUploadCardImage = async (file: File) => {
    if (!showEditCardDialog) return;
    setUploadingCardImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        `/boards/${boardId}/cards/${showEditCardDialog}/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedCard = response.data.card || response.data;
      setEditCardImageUrl(updatedCard.imageUrl || null);

      setColumns(prevColumns =>
        prevColumns.map(col => ({
          ...col,
          cards: col.cards.map(c => (c.id === showEditCardDialog ? { ...c, ...updatedCard } : c))
        }))
      );
    } catch (error: any) {
      console.error("Failed to upload card image:", error);
      alert(error.response?.data?.error || "Failed to upload card image");
    } finally {
      setUploadingCardImage(false);
    }
  };

  const handleRemoveCardImage = async () => {
    if (!showEditCardDialog) return;
    setUploadingCardImage(true);
    try {
      const response = await api.delete(`/boards/${boardId}/cards/${showEditCardDialog}/image`);
      const updatedCard = response.data.card || response.data;
      setEditCardImageUrl(updatedCard.imageUrl || null);

      setColumns(prevColumns =>
        prevColumns.map(col => ({
          ...col,
          cards: col.cards.map(c => (c.id === showEditCardDialog ? { ...c, ...updatedCard } : c))
        }))
      );
    } catch (error: any) {
      console.error("Failed to remove card image:", error);
      alert(error.response?.data?.error || "Failed to remove card image");
    } finally {
      setUploadingCardImage(false);
    }
  };

  const handleUpdateCardFromDialog = async () => {
    if (!showEditCardDialog || !editCardData.title.trim()) return;
    
    try {
      const response = await api.patch(`/boards/${boardId}/cards/${showEditCardDialog}`, {
        title: editCardData.title,
        description: editCardData.description || null
      });
      
      const updatedCard = response.data.card || response.data;
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === showEditCardDialog ? { ...card, ...updatedCard } : card
          )
        }))
      );
      
      if (editingCardId === showEditCardDialog) {
        setEditingCardId(null);
        setSelectedColumnId(null);
        setCardTitle("");
        setCardDescription("");
      }
      
      socketService.emitCardChange({
        boardId: parseInt(boardId),
        type: "UPDATED",
        cardId: showEditCardDialog,
        card: updatedCard
      });
      
      setToastMessage("Card successfully updated!");
      setShowToast(true);
      setShowEditCardDialog(null);
      setEditCardData({ title: "", description: "" });
      setEditCardImageUrl(null);
      
    } catch (error: any) {
      console.error("Failed to update card:", error);
      alert(error.response?.data?.error || "Failed to update card");
    }
  };

  const handleEditCardStart = (card: Card, columnId: number) => {
    setEditingCardId(card.id);
    setSelectedColumnId(columnId);
    setCardTitle(card.title);
    setCardDescription(card.description || "");
  };

  const handleEditCardSave = (cardId: number, title: string, description: string) => {
    setEditCardData({ title, description });
    handleUpdateCardFromDialog();
  };

  const handleEditCardCancel = () => {
    setEditingCardId(null);
    setSelectedColumnId(null);
    setCardTitle("");
    setCardDescription("");
  };

  const handleDeleteCard = (cardId: number) => {
    setCardToDelete(cardId);
    setShowCardDeleteDialog(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    
    const deletedCard = columns.flatMap(col => col.cards).find(card => card.id === cardToDelete);
    const originalColumn = columns.find(col => col.cards.some(card => card.id === cardToDelete));
    
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.filter(card => card.id !== cardToDelete)
      }))
    );
    
    setShowCardDeleteDialog(false);
    setCardToDelete(null);
    
    try {
      socketService.emitCardChange({
        boardId: parseInt(boardId),
        type: "DELETED",
        cardId: cardToDelete
      });
      
      await api.delete(`/boards/${boardId}/cards/${cardToDelete}`);
      
      setToastMessage("Card successfully deleted!");
      setShowToast(true);
      
    } catch (error: any) {
      if (deletedCard && originalColumn) {
        setColumns(prevColumns => 
          prevColumns.map(column => 
            column.id === originalColumn.id 
              ? { ...column, cards: [...column.cards, deletedCard] }
              : column
          )
        );
      }
      
      console.error("Failed to delete card:", error);
      alert(error.response?.data?.error || "Failed to delete card");
    }
  };

  // ==================== CHECKLIST FUNCTIONS ====================
  const handleToggleChecklistItem = async (cardId: number, itemId: number) => {
    const item = checklistItems[cardId]?.find(item => item.id === itemId);
    if (!item) return;
    
    const originalCompleted = item.completed;
    const newCompleted = !originalCompleted;
    
    setChecklistItems(prev => ({
      ...prev,
      [cardId]: (prev[cardId] || []).map(item => 
        item.id === itemId ? { ...item, completed: newCompleted } : item
      )
    }));
    
    const currentItems = checklistItems[cardId] || [];
    const completedCount = currentItems.filter(item => 
      item.id === itemId ? newCompleted : item.completed
    ).length;
    const newProgress = {
      total: currentItems.length,
      completed: completedCount,
      progress: Math.round((completedCount / currentItems.length) * 100)
    };
    
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.id === cardId ? { 
            ...card, 
            checklist: newProgress 
          } : card
        )
      }))
    );
    
    try {
      const response = await api.patch(`/boards/${cardId}/items/${itemId}`, {
        completed: newCompleted
      });
      
      socketService.emitChecklistUpdate({
        boardId: parseInt(boardId),
        type: "ITEM_TOGGLED",
        cardId: cardId,
        columnId: columns.find(col => col.cards.some(c => c.id === cardId))?.id || 0,
        itemId: itemId,
        item: response.data.item,
        progress: response.data.progress
      });
      
      if (response.data.progress && response.data.progress.progress !== newProgress.progress) {
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.id === cardId ? { 
                ...card, 
                checklist: response.data.progress 
              } : card
            )
          }))
        );
      }
      
    } catch (error: any) {
      setChecklistItems(prev => ({
        ...prev,
        [cardId]: (prev[cardId] || []).map(item => 
          item.id === itemId ? { ...item, completed: originalCompleted } : item
        )
      }));
      
      const originalProgress = {
        total: currentItems.length,
        completed: currentItems.filter(item => item.completed).length,
        progress: Math.round((currentItems.filter(item => item.completed).length / currentItems.length) * 100)
      };
      
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === cardId ? { 
              ...card, 
              checklist: originalProgress 
            } : card
          )
        }))
      );
      
      console.error("Failed to toggle checklist item:", error);
      alert(error.response?.data?.error || "Failed to update checklist item");
    }
  };

  const handleUpdateChecklistItem = async (cardId: number, itemId: number, text: string) => {
    if (!text.trim()) return;
    
    try {
      const response = await api.patch(`/boards/${cardId}/items/${itemId}`, {
        text
      });
      
      socketService.emitChecklistUpdate({
        boardId: parseInt(boardId),
        type: "ITEM_UPDATED",
        cardId: cardId,
        columnId: columns.find(col => col.cards.some(c => c.id === cardId))?.id || 0,
        itemId: itemId,
        item: response.data.item
      });
      
      setChecklistItems(prev => {
        const updatedItems = (prev[cardId] || []).map(item => 
          item.id === itemId ? response.data.item : item
        ).sort((a, b) => a.order - b.order);
        
        // Update progress from API response if available
        if (response.data.progress) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              cards: column.cards.map(card => 
                card.id === cardId ? { 
                  ...card, 
                  checklist: response.data.progress 
                } : card
              )
            }))
          );
        } else {
          // Calculate progress manually using updated items
          const completedCount = updatedItems.filter(item => item.completed).length;
          const newProgress = {
            total: updatedItems.length,
            completed: completedCount,
            progress: updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0
          };
          
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              cards: column.cards.map(card => 
                card.id === cardId ? { 
                  ...card, 
                  checklist: newProgress 
                } : card
              )
            }))
          );
        }
        
        return {
          ...prev,
          [cardId]: updatedItems
        };
      });
      
    } catch (error: any) {
      console.error("Failed to update checklist item:", error);
      alert(error.response?.data?.error || "Failed to update checklist item");
    }
  };

  const handleDeleteChecklistItem = (cardId: number, itemId: number) => {
    setChecklistToDelete({ cardId, itemId });
    setShowChecklistDeleteDialog(true);
  };

  const confirmDeleteChecklistItem = async () => {
    if (!checklistToDelete) return;
    
    try {
      const response = await api.delete(`/boards/${checklistToDelete.cardId}/items/${checklistToDelete.itemId}`);
      
      socketService.emitChecklistUpdate({
        boardId: parseInt(boardId),
        type: "ITEM_DELETED",
        cardId: checklistToDelete.cardId,
        columnId: columns.find(col => col.cards.some(c => c.id === checklistToDelete.cardId))?.id || 0,
        itemId: checklistToDelete.itemId,
        progress: response.data.progress
      });
      
      setChecklistItems(prev => ({
        ...prev,
        [checklistToDelete.cardId]: (prev[checklistToDelete.cardId] || []).filter(item => item.id !== checklistToDelete.itemId)
      }));
      
      if (response.data.progress) {
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.id === checklistToDelete.cardId ? { 
                ...card, 
                checklist: response.data.progress 
              } : card
            )
          }))
        );
      }
      
      setShowChecklistDeleteDialog(false);
      setChecklistToDelete(null);
      
    } catch (error: any) {
      console.error("Failed to delete checklist item:", error);
      alert(error.response?.data?.error || "Failed to delete checklist item");
    }
  };

  const handleCreateChecklistItem = async (cardId: number, text: string) => {
    if (!text.trim()) return;
    
    const tempId = Date.now();
    const currentItems = checklistItems[cardId] || [];
    const optimisticItem: ChecklistItem = {
      id: tempId,
      text,
      completed: false,
      order: currentItems.length,
      cardId: cardId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setChecklistItems(prev => ({
      ...prev,
      [cardId]: [...currentItems, optimisticItem].sort((a, b) => a.order - b.order)
    }));
    
    const newProgress = {
      total: currentItems.length + 1,
      completed: currentItems.filter(item => item.completed).length,
      progress: Math.round((currentItems.filter(item => item.completed).length / (currentItems.length + 1)) * 100)
    };
    
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.id === cardId ? { 
            ...card, 
            checklist: newProgress 
          } : card
        )
      }))
    );
    
    try {
      const response = await api.post(`/boards/${cardId}/items`, {
        text
      });
      
      setChecklistItems(prev => ({
        ...prev,
        [cardId]: (prev[cardId] || []).map(item => 
          item.id === tempId ? response.data.item : item
        ).sort((a, b) => a.order - b.order)
      }));
      
      if (response.data.progress) {
        setColumns(prevColumns => 
          prevColumns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.id === cardId ? { 
                ...card, 
                checklist: response.data.progress 
              } : card
            )
          }))
        );
      }
      
      socketService.emitChecklistUpdate({
        boardId: parseInt(boardId),
        type: "ITEM_CREATED",
        cardId: cardId,
        columnId: columns.find(col => col.cards.some(c => c.id === cardId))?.id || 0,
        item: response.data.item,
        progress: response.data.progress
      });
      
    } catch (error: any) {
      setChecklistItems(prev => ({
        ...prev,
        [cardId]: prev[cardId]?.filter(item => item.id !== tempId) || []
      }));
      
      const originalProgress = {
        total: currentItems.length,
        completed: currentItems.filter(item => item.completed).length,
        progress: currentItems.length > 0 ? Math.round((currentItems.filter(item => item.completed).length / currentItems.length) * 100) : 0
      };
      
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === cardId ? { 
              ...card, 
              checklist: originalProgress 
            } : card
          )
        }))
      );
      
      console.error("Failed to create checklist item:", error);
      alert(error.response?.data?.error || "Failed to create checklist item");
    }
  };

  const handleReorderChecklistItem = async (cardId: number, itemId: number, targetIndex: number) => {
    const items = [...(checklistItems[cardId] || [])];
    const draggedIndex = items.findIndex(item => item.id === itemId);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);
    
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setChecklistItems(prev => ({
      ...prev,
      [cardId]: reorderedItems
    }));
    
    try {
      const response = await api.put(`/boards/${cardId}/items/reorder`, {
        items: reorderedItems.map(item => ({ id: item.id, order: item.order }))
      });
      
      socketService.emitChecklistUpdate({
        boardId: parseInt(boardId),
        type: "ITEMS_REORDERED",
        cardId: cardId,
        columnId: columns.find(col => col.cards.some(c => c.id === cardId))?.id || 0,
        items: reorderedItems.map(item => ({ id: item.id, order: item.order }))
      });
      
    } catch (error: any) {
      console.error("Failed to reorder checklist items:", error);
      alert(error.response?.data?.error || "Failed to reorder checklist items");
      fetchChecklistItems(cardId);
    }
  };

  // ==================== DRAG & DROP FUNCTIONS ====================
  const handleColumnDragStart = (e: React.DragEvent, columnId: number, order: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragType", "column");
    e.dataTransfer.setData("columnId", columnId.toString());
    e.dataTransfer.setData("columnOrder", order.toString());
    setDraggedColumn({ id: columnId, order });
    setIsDraggingColumn(true);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setIsDraggingColumn(false);
  };

  const handleColumnDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragType = e.dataTransfer.getData("dragType");
    if (dragType !== "column") return;
    
    const draggedColumnId = parseInt(e.dataTransfer.getData("columnId"));
    const draggedColumnOrder = parseInt(e.dataTransfer.getData("columnOrder"));
    
    if (draggedColumnId === targetColumnId) return;
    
    try {
      const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
      const draggedIndex = sortedColumns.findIndex(col => col.id === draggedColumnId);
      const targetIndex = sortedColumns.findIndex(col => col.id === targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      const newColumns = [...sortedColumns];
      const [dragged] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, dragged);
      
      const reordered = newColumns.map((col, index) => ({ ...col, order: index }));
      setColumns(reordered);
      
      socketService.emitColumnMoved({
        boardId: parseInt(boardId),
        columnId: draggedColumnId,
        newOrder: targetIndex
      });
      
      const response = await api.put(`/boards/${boardId}/columns/${draggedColumnId}/move`, {
        order: targetIndex
      });
      
      console.log("Column move response:", response.data);
      
    } catch (error: any) {
      console.error("Failed to move column:", error);
      alert(error.response?.data?.error || "Failed to move column");
      fetchBoardDetails();
    }
  };

  const handleCardDragStart = (e: React.DragEvent, cardId: number, columnId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragType", "card");
    e.dataTransfer.setData("cardId", cardId.toString());
    e.dataTransfer.setData("fromColumnId", columnId.toString());
    setDraggedCard({ id: cardId, columnId });
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  const handleCardDrop = async (e: React.DragEvent, toColumnId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragType = e.dataTransfer.getData("dragType");
    if (dragType !== "card") return;
    
    const cardId = parseInt(e.dataTransfer.getData("cardId"));
    const fromColumnId = parseInt(e.dataTransfer.getData("fromColumnId"));
    
    if (fromColumnId === toColumnId) return;
    
    try {
      setColumns(prevColumns => {
        return prevColumns.map(column => {
          if (column.id === fromColumnId) {
            return {
              ...column,
              cards: column.cards.filter(card => card.id !== cardId)
            };
          }
          if (column.id === toColumnId) {
            const cardToMove = columns
              .find(col => col.id === fromColumnId)
              ?.cards.find(card => card.id === cardId);
              
            if (cardToMove) {
              return {
                ...column,
                cards: [...column.cards, { ...cardToMove, columnId: toColumnId, order: column.cards.length }]
              };
            }
          }
          return column;
        });
      });
      
      socketService.emitCardMoved({
        boardId: parseInt(boardId),
        cardId,
        fromColumnId,
        toColumnId,
        newOrder: 0
      });
      
      const response = await api.put(`/boards/${boardId}/cards/${cardId}/move`, {
        columnId: toColumnId
      });
      
      console.log("Move response:", response.data);
      
    } catch (error: any) {
      console.error("Failed to move card:", error);
      alert(error.response?.data?.error || "Failed to move card");
      fetchBoardDetails();
    }
  };

  const handleCardDropOnCard = async (e: React.DragEvent, toCardId: number, toColumnId: number, toOrder: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragType = e.dataTransfer.getData("dragType");
    if (dragType !== "card") return;
    
    const draggedCardId = parseInt(e.dataTransfer.getData("cardId"));
    const fromColumnId = parseInt(e.dataTransfer.getData("fromColumnId"));
    
    if (draggedCardId === toCardId) return;
    
    try {
      setColumns(prevColumns => {
        return prevColumns.map(column => {
          if (column.id === fromColumnId) {
            return {
              ...column,
              cards: column.cards
                .filter(card => card.id !== draggedCardId)
                .map((card, index) => ({ ...card, order: index }))
            };
          }
          if (column.id === toColumnId) {
            const cardToMove = columns
              .find(col => col.id === fromColumnId)
              ?.cards.find(card => card.id === draggedCardId);
              
            if (cardToMove) {
              const newCards = [...column.cards];
              newCards.splice(toOrder, 0, { ...cardToMove, columnId: toColumnId, order: toOrder });
              return {
                ...column,
                cards: newCards.map((card, index) => ({ ...card, order: index }))
              };
            }
          }
          return column;
        });
      });
      
      socketService.emitCardMoved({
        boardId: parseInt(boardId),
        cardId: draggedCardId,
        fromColumnId,
        toColumnId,
        newOrder: toOrder
      });
      
      const response = await api.put(`/boards/${boardId}/cards/${draggedCardId}/move`, {
        columnId: toColumnId,
        order: toOrder
      });
      
      console.log("Card reorder response:", response.data);
      
    } catch (error: any) {
      console.error("Failed to reorder card:", error);
      alert(error.response?.data?.error || "Failed to reorder card");
      fetchBoardDetails();
    }
  };

  const handleChecklistDragStart = (e: React.DragEvent, itemId: number, cardId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragType", "checklist");
    e.dataTransfer.setData("itemId", itemId.toString());
    e.dataTransfer.setData("cardId", cardId.toString());
    setDraggedChecklistItem({ id: itemId, cardId });
  };

  const handleChecklistDragEnd = () => {
    setDraggedChecklistItem(null);
  };

  const handleChecklistDrop = (targetCardId: number, itemId: number, targetIndex: number) => {
    handleReorderChecklistItem(targetCardId, itemId, targetIndex);
  };

  // ==================== RENDER ====================
// ==================== RENDER ====================
  if (loading) {
    return (
      <div className="mt-24 px-6">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          {/* Spinner element */}
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          
          {/* Loading text */}
          <p className="text-gray-500 font-medium animate-pulse">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-24 px-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="mt-24 px-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">Board not found</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt- px-6 pb-12">
      {/* Loading overlay saat sync */}
      {isSyncing && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-sm">Syncing changes...</span>
        </div>
      </div>
      )}

      {/* Header */}
      <BoardHeader
        board={board}
        onBack={() => router.push("/dashboard")}
        onMemberAdded={fetchBoardDetails}
      />

      {/* Column List */}
      <ColumnList
        columns={columns}
        boardId={boardId}
        editingColumnId={editingColumnId}
        editingCardId={editingCardId}
        expandedCardId={expandedCardId}
        showCardDialog={showCardDialog}
        cardTitle={cardTitle}
        cardDescription={cardDescription}
        checklistItems={checklistItems}
        draggedCard={draggedCard}
        draggedColumn={draggedColumn}
        isDraggingColumn={isDraggingColumn}
        apiOrigin={getApiOrigin()}
        getFallbackCoverClass={getFallbackCoverClass}
        
        onEditColumnStart={handleEditColumnStart}
        onEditColumnSave={handleEditColumnSave}
        onEditColumnCancel={handleEditColumnCancel}
        onDeleteColumn={handleDeleteColumn}
        onColumnDragStart={handleColumnDragStart}
        onColumnDragEnd={handleColumnDragEnd}
        onColumnDrop={handleColumnDrop}
        
        onCardEditStart={handleEditCardStart}
        onCardEditSave={handleEditCardSave}
        onCardEditCancel={handleEditCardCancel}
        onCardDelete={handleDeleteCard}
        onCardOpenEditDialog={handleOpenEditCardDialog}
        onCardDragStart={handleCardDragStart}
        onCardDragEnd={handleCardDragEnd}
        onCardDrop={handleCardDrop}
        onCardDropOnCard={handleCardDropOnCard}
        
        onToggleChecklistExpand={(cardId) => setExpandedCardId(prev => prev === cardId ? null : cardId)}
        onToggleChecklistItem={handleToggleChecklistItem}
        onUpdateChecklistItem={handleUpdateChecklistItem}
        onDeleteChecklistItem={handleDeleteChecklistItem}
        onCreateChecklistItem={handleCreateChecklistItem}
        onReorderChecklistItem={handleReorderChecklistItem}
        onChecklistDragStart={handleChecklistDragStart}
        onChecklistDragEnd={handleChecklistDragEnd}
        
        onCardTitleChange={setCardTitle}
        onCardDescriptionChange={setCardDescription}
        onCreateCard={handleCreateCard}
        onShowCardDialog={setShowCardDialog}
        
        onAddColumn={() => setShowColumnDialog(true)}
      />

                  
      {/* Drag & Drop Instruction */}
      {(draggedCard || draggedColumn || draggedChecklistItem) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          {draggedChecklistItem ? "✋ Drag checklist item to reorder" : draggedCard ? "✋ Drag card to move it" : "✋ Drag column to reorder"}
        </div>
      )}
      
      {/* Dialogs */}
      <CreateColumnDialog
        isOpen={showColumnDialog}
        title={columnTitle}
        onOpenChange={setShowColumnDialog}
        onTitleChange={setColumnTitle}
        onCreate={handleCreateColumn}
      />

      <EditCardDialog
        isOpen={!!showEditCardDialog}
        cardId={showEditCardDialog}
        cardData={editCardData}
        imageUrl={editCardImageUrl}
        checklistItems={checklistItems[showEditCardDialog || 0] || []}
        uploadingImage={uploadingCardImage}
        apiOrigin={getApiOrigin()}
        getFallbackCoverClass={getFallbackCoverClass}
        onClose={() => {
          setShowEditCardDialog(null);
          setEditCardData({ title: "", description: "" });
          setEditCardImageUrl(null);
        }}
        onUpdate={handleUpdateCardFromDialog}
        onTitleChange={(value) => setEditCardData(prev => ({ ...prev, title: value }))}
        onDescriptionChange={(value) => setEditCardData(prev => ({ ...prev, description: value }))}
        onImageUpload={handleUploadCardImage}
        onImageRemove={handleRemoveCardImage}
        onChecklistToggle={(itemId) => showEditCardDialog && handleToggleChecklistItem(showEditCardDialog, itemId)}
        onChecklistUpdate={(itemId, text) => showEditCardDialog && handleUpdateChecklistItem(showEditCardDialog, itemId, text)}
        onChecklistDelete={(itemId) => showEditCardDialog && handleDeleteChecklistItem(showEditCardDialog, itemId)}
        onChecklistCreate={(text) => showEditCardDialog && handleCreateChecklistItem(showEditCardDialog, text)}
        onChecklistDragStart={handleChecklistDragStart}
        onChecklistDragEnd={handleChecklistDragEnd}
        onChecklistDrop={(targetIndex) => showEditCardDialog && draggedChecklistItem && 
          handleChecklistDrop(showEditCardDialog, draggedChecklistItem.id, targetIndex)}
      />

      {/* Delete Dialogs */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Column"
        description="Are you sure you want to delete this column? This will also delete all cards in it and cannot be undone."
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteColumn}
      />

      <DeleteConfirmationDialog
        isOpen={showChecklistDeleteDialog}
        title="Delete Checklist Item"
        description="Are you sure you want to delete this checklist item? This action cannot be undone."
        onOpenChange={setShowChecklistDeleteDialog}
        onConfirm={confirmDeleteChecklistItem}
      />

      <DeleteConfirmationDialog
        isOpen={showCardDeleteDialog}
        title="Delete Card"
        description="Are you sure you want to delete this card? This will also delete all checklist items in it and cannot be undone."
        onOpenChange={setShowCardDeleteDialog}
        onConfirm={confirmDeleteCard}
      />

      {/* Toast */}
      <BoardToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}