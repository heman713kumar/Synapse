// C:\Users\hemant\Downloads\synapse\src\components\KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
import { Idea, User, Page, KanbanBoard as KanbanBoardType, KanbanTask, KanbanColumnId } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { LoaderIcon } from './icons';

interface KanbanBoardProps {
    ideaId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const TaskCard: React.FC<{
    task: KanbanTask;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}> = ({ task, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        className="bg-[#252532] p-3 rounded-lg border-2 border-[#374151] cursor-grab active:cursor-grabbing"
    >
        <h4 className="font-semibold text-white">{task.title}</h4>
        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
    </div>
);

const BoardColumn: React.FC<{
    column: KanbanBoardType['columns'][KanbanColumnId];
    tasks: KanbanTask[];
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}> = ({ column, tasks, onDragOver, onDrop, onDragStart }) => (
    <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.id)}
        className="w-80 bg-[#101018] rounded-xl flex flex-col flex-shrink-0"
    >
        <h3 className="font-bold text-lg text-white p-4 border-b border-white/10">{column.title} ({tasks.length})</h3>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} onDragStart={(e, taskId) => onDragStart(e, taskId)} />
            ))}
        </div>
    </div>
);


export const KanbanBoard: React.FC<KanbanBoardProps> = ({ ideaId, currentUser, setPage }) => {
    const [idea, setIdea] = useState<Idea | null>(null);
    const [board, setBoard] = useState<KanbanBoardType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // api is now backendApiService
                const ideaData = await api.getIdeaById(ideaId);
                // --- (FIX 1/5) Add safety check for collaborators array ---
                if (ideaData && (ideaData.ownerId === currentUser.userId || (ideaData.collaborators || []).includes(currentUser.userId))) {
                    setIdea(ideaData);
                    setBoard(ideaData.kanbanBoard || null); 
                } else {
                    alert("You don't have access to this project board.");
                    setPage('feed');
                }
            } catch (error) {
                console.error("Failed to fetch kanban board:", error);
                alert("Could not load project board.");
                setPage('ideaDetail', ideaId);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [ideaId, currentUser, setPage]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: KanbanColumnId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId || !board) return;

        // Find the source column
        let sourceColumnId: KanbanColumnId | undefined;
        for (const colId of board.columnOrder) {
            // --- (FIX 2/5) Add safety check for taskIds array ---
            if ((board.columns[colId].taskIds || []).includes(taskId)) {
                sourceColumnId = colId as KanbanColumnId;
                break;
            }
        }
        
        if (!sourceColumnId || sourceColumnId === targetColumnId) return;

        // Optimistic update
        const newBoard = { ...board };
        
        const sourceColumn = newBoard.columns[sourceColumnId];
        const targetColumn = newBoard.columns[targetColumnId];

        // Create new taskIds arrays
        // --- (FIX 3/5) Add safety check for taskIds array ---
        const newTaskIdsSource = (sourceColumn.taskIds || []).filter(id => id !== taskId);
        // --- (FIX 4/5) Add safety check for taskIds array ---
        const newTaskIdsTarget = [...(targetColumn.taskIds || []), taskId];
        
        // Update the board state immutably
        setBoard(prevBoard => {
            if (!prevBoard) return null;
            return {
                ...prevBoard,
                columns: {
                    ...prevBoard.columns,
                    [sourceColumnId]: {
                        ...prevBoard.columns[sourceColumnId],
                        taskIds: newTaskIdsSource,
                    },
                    [targetColumnId]: {
                        ...prevBoard.columns[targetColumnId],
                        taskIds: newTaskIdsTarget,
                    },
                },
            };
        });
        
        // Create the board data to be saved
        const updatedBoardForAPI = {
            ...board,
             columns: {
                ...board.columns,
                [sourceColumnId]: { ...sourceColumn, taskIds: newTaskIdsSource },
                [targetColumnId]: { ...targetColumn, taskIds: newTaskIdsTarget },
            }
        };

        try {
            // API call to save
            await api.updateKanbanBoard(ideaId, updatedBoardForAPI);
        } catch (error) {
            console.error("Failed to save kanban board update:", error);
            alert("Failed to save changes. Reverting.");
            // Revert state on failure
            setBoard(board); 
        }
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-[#0A0A0F]"><LoaderIcon className="w-8 h-8 animate-spin" /></div>;
    }
    if (!idea || !board) {
        // This handles the case where the idea exists but the board hasn't been created
        // You might want a button here to *create* the board
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0F]">
                 <h2 className="text-2xl font-bold text-white mb-4">Project Board Not Found</h2>
                 <p className="text-gray-400">This project does not have a Kanban board yet.</p>
                 {/* TODO: Add a "Create Board" button for the owner */}
                 <button onClick={() => setPage('ideaDetail', ideaId)} className="mt-6 bg-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                    &larr; Back to Idea Details
                </button>
            </div>
        );
    }
    
    return (
        <div className="w-full h-screen flex flex-col bg-[#0A0A0F] text-white">
            <header className="p-4 bg-[#1A1A24]/90 backdrop-blur-sm border-b border-white/10 flex justify-between items-center z-20 flex-shrink-0">
                <button onClick={() => setPage('ideaDetail', ideaId)} className="bg-[#252532] px-4 py-2 rounded-lg text-sm hover:bg-[#374151]">&larr; Back to Idea</button>
                <div className="text-center">
                    <h1 className="text-xl font-bold">{idea.title}</h1>
                    <p className="text-sm text-gradient">Project Board</p>
                </div>
                 <div className="w-28"/>
            </header>
            <main className="flex-1 p-4 overflow-x-auto">
                <div className="flex space-x-4 h-full">
                    {board.columnOrder.map(columnId => {
                        const column = board.columns[columnId];
                        // --- (FIX 5/5) Add safety check for taskIds array ---
                        const tasks = (column.taskIds || []).map(taskId => board.tasks[taskId]);
                        return (
                            <BoardColumn
                                key={column.id}
                                column={column}
                                tasks={tasks}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragStart={(e, taskId) => handleDragStart(e, taskId)}
                            />
                        );
                    })}
                </div>
            </main>
        </div>
    );
};