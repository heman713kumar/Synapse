// C:\Users\hemant\Downloads\synapse\src\components\IdeaBoard.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// FIX 1: Remove the IdeaBoard type entirely to prevent the TS6133 unused declaration error.
import { Idea, User, Page, IdeaNode, NodeComment, IdeaBoardVersion } from '../types'; 
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import * as Icons from './icons';

interface IdeaBoardProps {
    ideaId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// Helper to get SVG coordinates from screen coordinates
const getSVGCoords = (svg: SVGSVGElement, x: number, y: number): { x: number; y: number } => {
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: svgPt.x, y: svgPt.y };
};

const NodeComponent: React.FC<{
    node: IdeaNode;
    isSelected: boolean;
    onSelect: (e: React.MouseEvent, node: IdeaNode) => void;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
}> = ({ node, isSelected, onSelect, onMouseDown }) => (
    <g
        transform={`translate(${node.x}, ${node.y})`}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onClick={(e) => onSelect(e, node)}
        className="cursor-pointer group"
    >
        <rect
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx="10"
            ry="10"
            fill="#1A1A24"
            stroke={isSelected ? '#8B5CF6' : '#4B5563'}
            strokeWidth="2"
            className="transition-all group-hover:stroke-indigo-500"
        />
        <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT} x="0" y="0">
            {/* Added pointer-events-none to fix text selection issue */}
            <div className="w-full h-full p-3 flex flex-col justify-center text-center overflow-hidden pointer-events-none">
                <p className="font-bold text-white truncate">{node.title}</p>
                <p className="text-sm text-gray-400 truncate">{node.description}</p>
            </div>
        </foreignObject>
    </g>
);

const ConnectionLine: React.FC<{ fromNode: IdeaNode; toNode: IdeaNode; }> = ({ fromNode, toNode }) => {
    const fromX = fromNode.x + NODE_WIDTH / 2;
    const fromY = fromNode.y + NODE_HEIGHT / 2;
    const toX = toNode.x + NODE_WIDTH / 2;
    const toY = toNode.y + NODE_HEIGHT / 2;
    // Using a simple straight line for connections
    // const pathData = `M ${fromX},${fromY} C ${fromX},${(fromY + toY) / 2} ${toX},${(fromY + toY) / 2} ${toX},${toY}`;
    const pathData = `M ${fromX},${fromY} L ${toX},${toY}`;
    return <path d={pathData} stroke="#4B5563" strokeWidth="2" fill="none" />;
};


const SidePanel: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; }> = ({ title, children, onClose }) => (
    <div className="absolute top-0 right-0 h-full w-80 bg-[#1A1A24]/80 backdrop-blur-md border-l border-white/10 z-20 flex flex-col animate-slideInFromRight">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><Icons.XIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
            {children}
        </div>
    </div>
);

const EditPanel: React.FC<{ node: IdeaNode; onUpdate: (id: string, data: Partial<Omit<IdeaNode, 'id'>>) => void; onDelete: (id: string) => void; onConnectStart: (id: string) => void; }> = ({ node, onUpdate, onDelete, onConnectStart }) => {
    const [title, setTitle] = useState(node.title);
    const [description, setDescription] = useState(node.description);

    useEffect(() => {
        setTitle(node.title);
        setDescription(node.description);
    }, [node]);

    const handleUpdate = () => {
        onUpdate(node.id, { title, description });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-400">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={handleUpdate} className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 mt-1 text-white" />
            </div>
            <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} onBlur={handleUpdate} rows={4} className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 mt-1 text-white" />
            </div>
            <div className="flex space-x-2">
                <button onClick={() => onConnectStart(node.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg text-sm">Connect Node</button>
                <button onClick={() => onDelete(node.id)} className="bg-red-600 hover:bg-red-700 p-2 rounded-lg"><Icons.TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

const SaveVersionModal: React.FC<{
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave(name);
        } catch (error) {
            console.error("Failed to save version:", error);
            alert("Failed to save version. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSave} className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 max-w-sm w-full p-8 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-white mb-6">Save New Version</h2>
                <div>
                    <label htmlFor="versionName" className="block text-sm font-medium text-gray-300 mb-1">Version Name</label>
                    <input
                        id="versionName"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="e.g., Initial Brainstorm"
                        className="w-full bg-[#252532] border-2 border-[#374151] rounded-lg p-2 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving || !name.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Version'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const SaveStatusIndicator: React.FC<{ status: 'saved' | 'unsaved' | 'saving' }> = ({ status }) => {
    switch (status) {
        case 'saving':
            return <div className="flex items-center space-x-2 text-sm text-cyan-400"><Icons.LoaderIcon className="w-4 h-4 animate-spin"/><span>Saving...</span></div>;
        case 'unsaved':
            return <div className="flex items-center space-x-2 text-sm text-yellow-400"><span>Unsaved changes</span></div>;
        case 'saved':
        default:
            return <div className="flex items-center space-x-2 text-sm text-emerald-400"><Icons.CheckCircleIcon className="w-4 h-4"/><span>All changes saved</span></div>;
    }
};

export const IdeaBoard: React.FC<IdeaBoardProps> = ({ ideaId, currentUser, setPage }) => {
    const [idea, setIdea] = useState<Idea | null>(null);
    const [nodes, setNodes] = useState<IdeaNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<IdeaNode[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const [draggingNode, setDraggingNode] = useState<{ id: string, dx: number, dy: number } | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<'edit' | 'comments' | 'versions' | 'templates' | null>(null);

    const [comments, setComments] = useState<NodeComment[]>([]);
    const [versions, setVersions] = useState<IdeaBoardVersion[]>([]);
    const [isSaveVersionModalOpen, setIsSaveVersionModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

    const svgRef = useRef<SVGSVGElement>(null);
    const lastSavedNodesJson = useRef('');
    
    const isOwner = useMemo(() => idea?.ownerId === currentUser.userId, [idea, currentUser]);
    
    const sortNodes = (a: IdeaNode, b: IdeaNode) => a.id.localeCompare(b.id);

    const fetchData = useCallback(async () => {
        try {
            // Now uses real API
            const [ideaData, commentsData, versionsData] = await Promise.all([
                api.getIdeaById(ideaId),
                api.getCommentsByNodeId(ideaId), 
                api.getBoardVersions(ideaId), 
            ]);

            // FIX 2: Define a default structure that satisfies the IdeaBoard interface.
            // Using inline type definition to resolve naming conflict (TS2749)
            const defaultIdeaBoard: { nodes: IdeaNode[]; isPublic: boolean } = { nodes: [], isPublic: false };
            
            const ideaWithDefaults = { 
                ...ideaData, 
                // CRITICAL FIX: Ensure ideaBoard property exists and contains mandatory fields
                ideaBoard: ideaData?.ideaBoard || defaultIdeaBoard,
            };
            
            // FIX 2: Set the state with the fully structured object.
            setIdea(ideaWithDefaults);
            
            if (ideaData) {
                // Use safe property access: access nodes directly from the safe ideaBoard object
                const ideaBoardNodes = ideaWithDefaults.ideaBoard.nodes || [];
                const sortedNodes = [...ideaBoardNodes].sort(sortNodes);
                
                setNodes(sortedNodes);
                lastSavedNodesJson.current = JSON.stringify(sortedNodes);
                
                if(history.length === 1 && history[0].length === 0) {
                    setHistory([sortedNodes]);
                    setHistoryIndex(0);
                }
                setComments(commentsData || []);
                setVersions(versionsData || []);
            }
        } catch (error) {
            console.error("Failed to fetch board data:", error);
            // Alert user that board failed to load and redirect back to the Detail page
            alert("Could not load idea board. Redirecting to Idea Detail.");
            setPage('ideaDetail', ideaId); // Redirect to the detail page on failure
        } finally {
            setIsLoading(false);
        }
    }, [ideaId, setPage]); // Removed history from deps

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Debounced auto-save effect
    useEffect(() => {
        if (!isOwner || isLoading) return;

        const currentNodesJson = JSON.stringify([...nodes].sort(sortNodes));
        
        if (currentNodesJson !== lastSavedNodesJson.current) {
            setSaveStatus('unsaved');

            const saveTimeout = setTimeout(async () => {
                setSaveStatus('saving');
                try {
                    // Now uses real API
                    await api.updateIdeaBoard(ideaId, nodes); // Assumes this exists in backendApi
                    lastSavedNodesJson.current = currentNodesJson;
                    setSaveStatus('saved');
                } catch (error) {
                    console.error("Auto-save failed:", error);
                    setSaveStatus('unsaved');
                }
            }, 2000); // Save after 2 seconds of inactivity

            return () => clearTimeout(saveTimeout);
        }
    }, [nodes, ideaId, isOwner, isLoading]);

    // Save on navigate away (component unmount)
    useEffect(() => {
        if (!isOwner) return;

        const nodesRef = { current: nodes };
        nodesRef.current = nodes;

        return () => {
            const currentNodesJson = JSON.stringify([...nodesRef.current].sort(sortNodes));
            if (currentNodesJson !== lastSavedNodesJson.current) {
                // Now uses real API
                api.updateIdeaBoard(ideaId, nodesRef.current).catch(err => { // Fire-and-forget with error catch
                    console.error("Save on unmount failed:", err);
                });
            }
        };
    }, [nodes, ideaId, isOwner]);


    const addToHistory = useCallback((newNodes: IdeaNode[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newNodes);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setNodes(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setNodes(history[historyIndex + 1]);
        }
    };
    
    // Board Interaction Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === svgRef.current) {
            setIsDraggingBoard(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingBoard) {
            const dx = (e.clientX - dragStart.x) / view.zoom;
            const dy = (e.clientY - dragStart.y) / view.zoom;
            setView(v => ({ ...v, x: v.x - dx, y: v.y - dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
        if (draggingNode) {
            const newNodes = nodes.map(n => {
                if (n.id === draggingNode.id) {
                    const { x, y } = getSVGCoords(svgRef.current!, e.clientX, e.clientY);
                    return { ...n, x: x - draggingNode.dx, y: y - draggingNode.dy };
                }
                return n;
            });
            setNodes(newNodes);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingBoard(false);
        if (draggingNode) {
            addToHistory(nodes);
            setDraggingNode(null);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? view.zoom * zoomFactor : view.zoom / zoomFactor;
        setView(v => ({...v, zoom: Math.max(0.1, Math.min(newZoom, 5))}));
    };
    
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if(!isOwner) return;
        const { x, y } = getSVGCoords(svgRef.current!, e.clientX, e.clientY);
        const node = nodes.find(n => n.id === nodeId)!;
        setDraggingNode({ id: nodeId, dx: x - node.x, dy: y - node.y });
    };

    const handleNodeSelect = (e: React.MouseEvent, node: IdeaNode) => {
        e.stopPropagation();
        if (connectingNodeId && connectingNodeId !== node.id) {
            const updatedNodes = nodes.map(n => {
                if (n.id === connectingNodeId) {
                    // --- (FIX 2/5) Add safety check for connections array ---
                    const currentConnections = n.connections || [];
                    if (currentConnections.includes(node.id)) { // Disconnect if already connected
                        return { ...n, connections: currentConnections.filter(c => c !== node.id) };
                    }
                    return { ...n, connections: [...currentConnections, node.id] };
                }
                return n;
            });
            setNodes(updatedNodes);
            addToHistory(updatedNodes);
            setConnectingNodeId(null);
        } else {
            setSelectedNodeId(node.id);
            setActivePanel('edit');
        }
    };

    // CRUD and other actions
    const handleAddNode = () => {
        const newNode: IdeaNode = {
            id: `node-${Date.now()}`,
            x: view.x + (1000 / view.zoom) / 2 - NODE_WIDTH / 2, // Center in viewport
            y: view.y + (800 / view.zoom) / 2 - NODE_HEIGHT / 2, // Center in viewport
            title: 'New Node',
            description: 'Click to edit',
            connections: [] // Initialize connections safely
        };
        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        addToHistory(newNodes);
    };

    const handleUpdateNode = (id: string, data: Partial<Omit<IdeaNode, 'id'>>) => {
        const newNodes = nodes.map(n => n.id === id ? { ...n, ...data } : n);
        setNodes(newNodes);
        addToHistory(newNodes);
    };
    
    const handleDeleteNode = (id: string) => {
        const newNodes = nodes
            .filter(n => n.id !== id)
            .map(n => ({...n, connections: (n.connections || []).filter(c => c !== id)})); // --- (FIX 3/5) Add safety check here ---
        setNodes(newNodes);
        addToHistory(newNodes);
        setSelectedNodeId(null);
        setActivePanel(null);
    };

    const handleSaveVersion = async (name: string) => {
        // Now uses real API
        const newVersion = await api.saveBoardVersion(ideaId, nodes, name); // Assumes this exists
        setVersions(prev => [newVersion, ...prev]);
        setIsSaveVersionModalOpen(false);
    };
    
    const handleRevertVersion = async (versionId: string) => {
        if (window.confirm("Are you sure you want to revert to this version? Your current board will be replaced.")) {
            try {
                // Now uses real API
                const revertedData = await api.revertToBoardVersion(ideaId, versionId); // Assumes this exists
                if(revertedData && revertedData.nodes) {
                     // --- (FIX 4/5) Add safety check for reverted nodes array ---
                    const revertedNodes = revertedData.nodes || [];
                    setNodes(revertedNodes);
                    addToHistory(revertedNodes);
                    setActivePanel(null);
                    alert("Board reverted successfully.");
                } else {
                    alert("Failed to revert board.");
                }
            } catch (error: any) {
                 console.error("Failed to revert board:", error);
                 alert(`Failed to revert board: ${error.message}`);
            }
        }
    };

    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
    // --- (FIX 5/5) Add safety check for comments array ---
    const nodeComments = useMemo(() => (comments || []).filter(c => c.nodeId === selectedNodeId), [comments, selectedNodeId]);
    
    if (isLoading) return <div className="w-screen h-screen bg-[#0A0A0F] flex items-center justify-center"><Icons.LoaderIcon className="w-8 h-8 animate-spin text-indigo-400"/></div>;
    if (!idea) return <div className="w-screen h-screen bg-[#0A0A0F] flex items-center justify-center">Idea not found.</div>;
    
    return (
        <div className="w-screen h-screen bg-[#0A0A0F] text-white flex flex-col overflow-hidden">
            {isSaveVersionModalOpen && <SaveVersionModal onClose={() => setIsSaveVersionModalOpen(false)} onSave={handleSaveVersion} />}

            <header className="p-4 bg-[#1A1A24]/90 backdrop-blur-sm border-b border-white/10 flex justify-between items-center z-20 flex-shrink-0">
                <button onClick={() => setPage('ideaDetail', ideaId)} className="bg-[#252532] px-4 py-2 rounded-lg text-sm hover:bg-[#374151]">&larr; Back to Idea</button>
                <div className="text-center">
                    <h1 className="text-xl font-bold">{idea.title}</h1>
                    <p className="text-sm text-gray-400">Idea Board</p>
                </div>
                <div className="w-48 flex justify-end">
                    {isOwner && <SaveStatusIndicator status={saveStatus} />}
                </div>
            </header>

            <div className="flex-1 relative" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
                <svg ref={svgRef} className="w-full h-full" onMouseDown={handleMouseDown} onWheel={handleWheel}>
                    <g transform={`scale(${view.zoom}) translate(${-view.x}, ${-view.y})`}>
                        {/* FIX 3 & 4: Apply optional chaining to access nodes */}
                        {idea.ideaBoard?.nodes?.map(fromNode => 
                            (fromNode.connections || []).map(toId => { // Add safety check here
                                // FIX 5: Use optional chaining on idea.ideaBoard.nodes lookup
                                const toNode = idea.ideaBoard?.nodes.find(n => n.id === toId);
                                if (!toNode) return null;
                                return <ConnectionLine key={`${fromNode.id}-${toNode.id}`} fromNode={fromNode} toNode={toNode} />;
                            })
                        )}
                        {nodes.map(node => (
                            <NodeComponent 
                                key={node.id} 
                                node={node} 
                                isSelected={node.id === selectedNodeId || node.id === connectingNodeId}
                                onSelect={handleNodeSelect}
                                onMouseDown={handleNodeMouseDown}
                            />
                        ))}
                    </g>
                </svg>
                
                {activePanel && selectedNode && (
                     <SidePanel title="Node Details" onClose={() => { setSelectedNodeId(null); setActivePanel(null); }}>
                        <div className="flex border-b border-white/10 mb-4">
                           <button onClick={() => setActivePanel('edit')} className={`flex-1 p-2 text-sm ${activePanel==='edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Edit</button>
                           <button onClick={() => setActivePanel('comments')} className={`flex-1 p-2 text-sm ${activePanel==='comments' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Comments ({nodeComments.length})</button>
                        </div>
                        {activePanel === 'edit' && isOwner && <EditPanel node={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onConnectStart={(id) => { setConnectingNodeId(id); setSelectedNodeId(null); setActivePanel(null); }}/>}
                        {activePanel === 'edit' && !isOwner && <p className="text-gray-400">You do not have permission to edit this node.</p>}
                        {/* Add Comments Panel content here */}
                        {activePanel === 'comments' && (
                            <div className="text-gray-400">Comment section not yet implemented.</div>
                        )}
                     </SidePanel>
                )}
                 {activePanel === 'versions' && (
                    <SidePanel title="Board Versions" onClose={() => setActivePanel(null)}>
                        <div className="space-y-4">
                            {isOwner && (
                                <button onClick={() => setIsSaveVersionModalOpen(true)} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700">
                                    Save Current Version
                                </button>
                            )}
                            <ul className="space-y-2">
                                {versions.length > 0 ? versions.map(v => (
                                    <li key={v.versionId} className="bg-black/20 p-3 rounded-lg">
                                        <p className="font-semibold text-white">{v.name}</p>
                                        <p className="text-xs text-gray-400">Saved on {new Date(v.createdAt).toLocaleString()}</p>
                                        {isOwner && (
                                            <button onClick={() => handleRevertVersion(v.versionId)} className="mt-2 text-sm text-cyan-400 hover:underline">
                                                Revert to this version
                                            </button>
                                        )}
                                    </li>
                                )) : <p className="text-gray-500 text-center py-4">No saved versions yet.</p>}
                            </ul>
                        </div>
                    </SidePanel>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A24]/80 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-2 z-10">
                    <button onClick={handleAddNode} disabled={!isOwner} title="Add Node" className="p-2 hover:bg-white/10 rounded-md disabled:opacity-50"><Icons.PlusIcon className="w-5 h-5"/></button>
                    <button onClick={handleUndo} disabled={historyIndex <= 0 || !isOwner} title="Undo" className="p-2 hover:bg-white/10 rounded-md disabled:opacity-50"><Icons.UndoIcon className="w-5 h-5"/></button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || !isOwner} title="Redo" className="p-2 hover:bg-white/10 rounded-md disabled:opacity-50"><Icons.RedoIcon className="w-5 h-5"/></button>
                    <span className="w-px h-6 bg-white/20"/>
                    <button onClick={() => { setActivePanel('versions'); setSelectedNodeId(null); }} title="View Versions" className="p-2 hover:bg-white/10 rounded-md">
                        <Icons.HistoryIcon className="w-5 h-5"/>
                    </button>
                    <span className="w-px h-6 bg-white/20"/>
                    <button onClick={() => setView(v => ({...v, zoom: v.zoom * 1.2}))} title="Zoom In" className="p-2 hover:bg-white/10 rounded-md"><Icons.PlusIcon className="w-5 h-5"/></button>
                    <button onClick={() => setView(v => ({...v, zoom: v.zoom / 1.2}))} title="Zoom Out" className="p-2 hover:bg-white/10 rounded-md"><Icons.MinusIcon className="w-5 h-5"/></button>
                    <button onClick={() => setView({x:0, y:0, zoom: 1})} title="Reset View" className="p-2 hover:bg-white/10 rounded-md"><Icons.ZoomResetIcon className="w-5 h-5"/></button>
                </div>

                 {connectingNodeId && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-10">
                        Click another node to connect, or click it again to cancel.
                    </div>
                )}
            </div>
        </div>
    );
};