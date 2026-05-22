import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Idea, User, Page, KanbanBoard as KanbanBoardType, KanbanTask, KanbanColumnId } from '../types';
import api from '../services/backendApiService';
import { ArrowLeft, GripVertical, Plus, KanbanSquare } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { toast } from './ui/Toaster';
import { userName } from '../utils/format';
import { cn } from '../utils/cn';

interface KanbanBoardProps {
  ideaId: string;
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

const COLUMN_COLORS: Record<string, string> = {
  todo: 'border-l-sky-500',
  'in-progress': 'border-l-amber-500',
  done: 'border-l-emerald-500',
};

const TaskCard: React.FC<{
  task: KanbanTask;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}> = ({ task, onDragStart }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    draggable
    onDragStart={(e) => onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, task.id)}
    className="group surface p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-card-hover transition-all"
  >
    <div className="flex items-start gap-2">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex -space-x-2 mt-3">
            {task.assignedTo.slice(0, 3).map((uid) => (
              <Avatar key={uid} name={uid} size="xs" className="ring-2 ring-card" />
            ))}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const BoardColumn: React.FC<{
  column: KanbanBoardType['columns'][KanbanColumnId];
  tasks: KanbanTask[];
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}> = ({ column, tasks, onDragOver, onDrop, onDragStart }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { onDragOver(e); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, column.id); }}
      className={cn(
        'w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl border-2 border-l-4 transition-all',
        COLUMN_COLORS[column.id] ?? 'border-l-primary',
        isDragOver ? 'bg-primary/5 border-primary/40' : 'bg-card/40 border-border'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{column.title}</h3>
        <Badge variant="ghost" size="sm">{tasks.length}</Badge>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-border h-24 flex items-center justify-center text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
      <div className="p-2 border-t border-border/60">
        <Button variant="ghost" size="sm" fullWidth leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => toast('Add task coming soon', { icon: '✨' })}>
          Add task
        </Button>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ ideaId, currentUser, setPage }) => {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [board, setBoard] = useState<KanbanBoardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const ideaData = await api.getIdeaById(ideaId);
        if (!isMountedRef.current) return;
        const hasAccess = ideaData.ownerId === currentUser.userId || (ideaData.collaborators || []).includes(currentUser.userId);
        if (!hasAccess) {
          toast.error("You don't have access to this project board.");
          setPage('ideaDetail', ideaId);
          return;
        }
        setIdea(ideaData);
        setBoard(ideaData.kanbanBoard || null);
      } catch (e: any) {
        toast.error(e?.message ?? 'Could not load board');
        setPage('ideaDetail', ideaId);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };
    fetch();
  }, [ideaId, currentUser, setPage]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: KanbanColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId || !board) return;
    let sourceColumnId: KanbanColumnId | undefined;
    for (const colId of board.columnOrder) {
      if ((board.columns[colId].taskIds || []).includes(taskId)) {
        sourceColumnId = colId;
        break;
      }
    }
    if (!sourceColumnId || sourceColumnId === targetColumnId) return;

    const oldBoard = board;
    const sourceColumn = board.columns[sourceColumnId];
    const targetColumn = board.columns[targetColumnId];
    const newSource = (sourceColumn.taskIds || []).filter((id) => id !== taskId);
    const newTarget = [...(targetColumn.taskIds || []), taskId];
    const newBoard: KanbanBoardType = {
      ...board,
      columns: {
        ...board.columns,
        [sourceColumnId]: { ...sourceColumn, taskIds: newSource },
        [targetColumnId]: { ...targetColumn, taskIds: newTarget },
      },
    };
    setBoard(newBoard);
    try {
      await api.updateKanbanBoard(ideaId, newBoard);
    } catch {
      toast.error('Failed to save changes — reverted');
      setBoard(oldBoard);
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!idea || !board) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<KanbanSquare className="h-8 w-8" />}
          title="No Kanban board yet"
          description="Create a board to start tracking tasks for this idea."
          action={{ label: 'Back to idea', onClick: () => setPage('ideaDetail', ideaId) }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={() => setPage('ideaDetail', ideaId)} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Project board</p>
            <h1 className="text-base font-semibold truncate">{idea.title}</h1>
          </div>
        </div>
        <Badge variant="soft" size="sm">{userName(currentUser)}</Badge>
      </header>
      <main className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {board.columnOrder.map((columnId) => {
            const column = board.columns[columnId];
            const tasks = (column.taskIds || []).map((tid) => board.tasks[tid]).filter(Boolean);
            return (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={tasks}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};
