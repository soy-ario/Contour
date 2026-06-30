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
import { Edit2, Trash2, Plus, Loader2, FileText } from "lucide-react";
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
    <Card className="bg-white border border-[#ECECF4] rounded-[24px] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#ECECF4] py-4 px-7">
        <CardTitle className="text-xl font-bold text-[#111827]">
          Internal Notes (Admin Only)
        </CardTitle>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 text-xs font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-7 space-y-6">
        {/* Create Note Input Area */}
        {isAdding && (
          <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your operational internal notes here..."
              className="border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#F2485A] min-h-[90px]"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isPending}
                className="bg-[#090D16] text-white hover:bg-gray-800 text-xs font-semibold rounded-lg h-8"
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
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs h-8"
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
                  className="flex gap-3 p-4 border border-gray-100 hover:border-gray-200 rounded-xl bg-white group/note transition-all duration-200"
                >
                  <Avatar className="w-8 h-8 border border-gray-200 bg-gray-100 text-gray-600">
                    <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-gray-800">{creatorName}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{formatDate(note.createdAt, "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      
                      {/* Action buttons */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(note)}
                            className="w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(note.id)}
                            className="w-7 h-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
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
                          className="border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#F2485A] min-h-[70px]"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(note.id)}
                            disabled={isPending}
                            className="bg-[#090D16] text-white hover:bg-gray-800 text-xs font-semibold rounded-lg h-8"
                          >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={isPending}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-line">
                        {note.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-[#FAFAFB] border border-dashed border-gray-200 rounded-2xl">
              <FileText className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-700">No internal notes added yet.</p>
              <p className="text-xs text-gray-400 mt-1">Add notes to keep important client context in one place.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
