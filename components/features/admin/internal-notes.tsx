"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/lib/actions/note.actions";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Save, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  createdAt: string | Date;
  creator?: {
    name: string;
  } | null;
}

interface InternalNotesProps {
  clientId: string;
  initialNotes: Note[];
}

export default function InternalNotes({ clientId, initialNotes }: InternalNotesProps) {
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newContent, setNewContent] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingContent, setEditingContent] = React.useState("");
  const [isPending, startTransition] = useTransition();
  const [prevInitialNotes, setPrevInitialNotes] = React.useState<Note[]>(initialNotes);

  if (initialNotes !== prevInitialNotes) {
    setPrevInitialNotes(initialNotes);
    setNotes(initialNotes);
  }

  const handleCreate = async () => {
    if (!newContent.trim()) return;

    startTransition(async () => {
      const result = await createNoteAction(clientId, newContent);
      if (result.success) {
        toast.success("Note created successfully");
        setNewContent("");
        setIsAdding(false);
        // Optimistic refresh (revalidatePath will handle server sync, but we update locally immediately)
        if (result.data) {
          const newNote: Note = {
            id: result.data.id,
            content: result.data.content,
            createdAt: result.data.createdAt,
            creator: { name: "You" },
          };
          setNotes((prev) => [newNote, ...prev]);
        }
      } else {
        toast.error(result.error || "Failed to create note");
      }
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editingContent.trim()) return;

    startTransition(async () => {
      const result = await updateNoteAction(id, editingContent);
      if (result.success) {
        toast.success("Note updated successfully");
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, content: editingContent } : n))
        );
        setEditingId(null);
      } else {
        toast.error(result.error || "Failed to update note");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this internal note?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteNoteAction(id);
      if (result.success) {
        toast.success("Note deleted successfully");
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        toast.error(result.error || "Failed to delete note");
      }
    });
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-6">
        <CardTitle className="text-base font-bold text-foreground">
          Internal Notes (Admin Only)
        </CardTitle>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 text-xs font-semibold bg-zinc-900 border border-border text-foreground hover:bg-zinc-800 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Create Note Input Area */}
        {isAdding && (
          <div className="space-y-3 p-4 bg-zinc-900/40 border border-border/40 rounded-lg animate-in fade-in duration-200">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your operational internal notes here..."
              className="bg-zinc-950 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700 min-h-[90px]"
            />
            <div className="flex items-center space-x-2 justify-end">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Note"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewContent("");
                }}
                disabled={isPending}
                className="hover:bg-zinc-800 text-muted-foreground hover:text-foreground text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {notes.length > 0 ? (
            notes.map((note) => {
              const isEditing = editingId === note.id;
              const creatorName = note.creator?.name || "Admin Staff";
              const initials = creatorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={note.id}
                  className="flex space-x-3 p-4 border border-border/40 hover:border-zinc-800/80 rounded-lg bg-zinc-950/20 group/note transition-all duration-200"
                >
                  <Avatar className="w-8 h-8 border border-border bg-zinc-800 text-zinc-300">
                    <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-foreground/90">{creatorName}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-muted-foreground">{formatDate(note.createdAt, "PPp")}</span>
                      </div>
                      
                      {/* Action buttons */}
                      {!isEditing && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(note)}
                            className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-zinc-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(note.id)}
                            className="w-7 h-7 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 mt-1.5">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700 min-h-[70px]"
                        />
                        <div className="flex items-center space-x-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(note.id)}
                            disabled={isPending}
                            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold h-7"
                          >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={isPending}
                            className="hover:bg-zinc-800 text-muted-foreground hover:text-foreground text-xs h-7"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-line">
                        {note.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
              No internal notes recorded for this client.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
