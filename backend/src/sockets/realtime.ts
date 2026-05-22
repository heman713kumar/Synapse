/**
 * Real-time gateway expansion.
 *  - Presence (online/away/busy) with heartbeat
 *  - Forum / Idea Board live cursors
 *  - Typing indicators in chat
 *  - Yjs CRDT document sync hub
 *
 * Designed to plug into the existing Socket.IO server in socket.ts.
 * Usage in index.ts (or socket.ts):
 *
 *   import { attachRealtime } from './sockets/realtime';
 *   attachRealtime(io);
 */

import { Server, Socket } from 'socket.io';
import { query } from '../db/database';
import * as Y from 'yjs';                                  // optional: install `yjs` if you want server-side CRDT
import { LeveldbPersistence } from 'y-leveldb';            // optional: install `y-leveldb` for persistence

type AuthSocket = Socket & { userId?: string; userEmail?: string };

/** Per-room presence registry: room → Map<userId, socket> */
const presenceRegistry = new Map<string, Map<string, AuthSocket>>();

/** Yjs doc cache: docId → Y.Doc */
const yjsDocs = new Map<string, Y.Doc>();
let yjsPersistence: LeveldbPersistence | null = null;
try {
  yjsPersistence = new LeveldbPersistence('./yjs-data');
} catch (e) {
  console.warn('⚠ Yjs persistence not available — install `y-leveldb` and create ./yjs-data');
}

export function attachRealtime(io: Server) {
  // We assume auth middleware in socket.ts already attaches socket.userId
  io.on('connection', (socket: AuthSocket) => {
    if (!socket.userId) return;

    // ── PRESENCE ──
    setupPresence(io, socket);

    // ── ROOMS (forums, idea boards, ideas) ──
    setupRooms(io, socket);

    // ── TYPING ──
    setupTyping(io, socket);

    // ── LIVE CURSORS ──
    setupCursors(io, socket);

    // ── YJS DOC SYNC ──
    setupYjs(io, socket);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE
// ─────────────────────────────────────────────────────────────────────────────

function setupPresence(io: Server, socket: AuthSocket) {
  // Mark online on connect
  query(`
    INSERT INTO user_presence (user_id, status, last_seen, socket_id)
    VALUES ($1, 'online', NOW(), $2)
    ON CONFLICT (user_id) DO UPDATE
      SET status = 'online', last_seen = NOW(), socket_id = EXCLUDED.socket_id
  `, [socket.userId, socket.id]).catch((e) => console.warn('presence insert', e));

  // Broadcast to "presence" subscribers
  io.to(`presence:user:${socket.userId}`).emit('presence:update', { userId: socket.userId, status: 'online' });

  // Allow other users to subscribe to my presence
  socket.on('presence:subscribe', (userIds: string[]) => {
    userIds.forEach((uid) => socket.join(`presence:user:${uid}`));
  });

  socket.on('presence:unsubscribe', (userIds: string[]) => {
    userIds.forEach((uid) => socket.leave(`presence:user:${uid}`));
  });

  socket.on('presence:status', (status: 'online' | 'away' | 'busy') => {
    query(`UPDATE user_presence SET status = $1, last_seen = NOW() WHERE user_id = $2`, [status, socket.userId])
      .catch(() => {});
    io.to(`presence:user:${socket.userId}`).emit('presence:update', { userId: socket.userId, status });
  });

  socket.on('disconnect', () => {
    query(`UPDATE user_presence SET status = 'offline', last_seen = NOW() WHERE user_id = $1`, [socket.userId])
      .catch(() => {});
    io.to(`presence:user:${socket.userId}`).emit('presence:update', { userId: socket.userId, status: 'offline' });

    // Clean up rooms
    presenceRegistry.forEach((users, room) => {
      if (users.delete(socket.userId!)) {
        io.to(room).emit('room:members', Array.from(users.keys()));
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOMS  (forums:{ideaId}, board:{ideaId})
// ─────────────────────────────────────────────────────────────────────────────

function setupRooms(io: Server, socket: AuthSocket) {
  socket.on('room:join', (room: string) => {
    if (!isValidRoom(room)) return;
    socket.join(room);
    if (!presenceRegistry.has(room)) presenceRegistry.set(room, new Map());
    presenceRegistry.get(room)!.set(socket.userId!, socket);
    io.to(room).emit('room:members', Array.from(presenceRegistry.get(room)!.keys()));
  });

  socket.on('room:leave', (room: string) => {
    socket.leave(room);
    presenceRegistry.get(room)?.delete(socket.userId!);
    io.to(room).emit('room:members', Array.from(presenceRegistry.get(room)?.keys() ?? []));
  });
}

function isValidRoom(room: string): boolean {
  return /^(forum|board|idea|chat):[a-zA-Z0-9-]+$/.test(room);
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATORS
// ─────────────────────────────────────────────────────────────────────────────

function setupTyping(io: Server, socket: AuthSocket) {
  socket.on('typing:start', ({ room }: { room: string }) => {
    if (!isValidRoom(room)) return;
    socket.to(room).emit('typing:user', { userId: socket.userId, typing: true });
  });

  socket.on('typing:stop', ({ room }: { room: string }) => {
    socket.to(room).emit('typing:user', { userId: socket.userId, typing: false });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CURSORS (Figma-style)
// ─────────────────────────────────────────────────────────────────────────────

interface CursorPos { x: number; y: number; color: string; name?: string }

function setupCursors(io: Server, socket: AuthSocket) {
  socket.on('cursor:move', ({ room, pos }: { room: string; pos: CursorPos }) => {
    if (!isValidRoom(room)) return;
    // Throttle: only forward; don't persist
    socket.to(room).emit('cursor:update', { userId: socket.userId, pos });
  });

  socket.on('cursor:click', ({ room, pos }: { room: string; pos: CursorPos }) => {
    socket.to(room).emit('cursor:click', { userId: socket.userId, pos });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// YJS — CRDT DOC SYNC (real-time collaborative editing)
// ─────────────────────────────────────────────────────────────────────────────

async function getOrLoadDoc(docId: string): Promise<Y.Doc> {
  if (yjsDocs.has(docId)) return yjsDocs.get(docId)!;

  const doc = new Y.Doc();

  // Try to restore from leveldb persistence first
  if (yjsPersistence) {
    try {
      const persisted = await yjsPersistence.getYDoc(docId);
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(persisted));
    } catch {/* new doc */}
  } else {
    // Fallback: load from Postgres
    try {
      const { rows } = await query(`SELECT state FROM yjs_documents WHERE doc_id = $1`, [docId]);
      if (rows[0]?.state) Y.applyUpdate(doc, new Uint8Array(rows[0].state));
    } catch {/* new doc */}
  }

  // Persist on every update (debounced in production)
  doc.on('update', async (update: Uint8Array) => {
    if (yjsPersistence) {
      yjsPersistence.storeUpdate(docId, update).catch(() => {});
    } else {
      query(
        `INSERT INTO yjs_documents (doc_id, state, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (doc_id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
        [docId, Buffer.from(Y.encodeStateAsUpdate(doc))]
      ).catch(() => {});
    }
  });

  yjsDocs.set(docId, doc);
  return doc;
}

function setupYjs(io: Server, socket: AuthSocket) {
  socket.on('yjs:sync', async ({ docId, stateVector }: { docId: string; stateVector: number[] }) => {
    const doc = await getOrLoadDoc(docId);
    const sv = new Uint8Array(stateVector);
    const diff = Y.encodeStateAsUpdate(doc, sv);
    socket.emit('yjs:update', { docId, update: Array.from(diff) });
  });

  socket.on('yjs:update', async ({ docId, update }: { docId: string; update: number[] }) => {
    const doc = await getOrLoadDoc(docId);
    Y.applyUpdate(doc, new Uint8Array(update), socket.id);
    // Rebroadcast to all other clients on this doc
    socket.to(`yjs:${docId}`).emit('yjs:update', { docId, update });
  });

  socket.on('yjs:join', async ({ docId }: { docId: string }) => {
    if (!/^[a-zA-Z0-9-]+$/.test(docId)) return;
    socket.join(`yjs:${docId}`);
    const doc = await getOrLoadDoc(docId);
    socket.emit('yjs:initial', { docId, state: Array.from(Y.encodeStateAsUpdate(doc)) });
  });

  socket.on('yjs:leave', ({ docId }: { docId: string }) => {
    socket.leave(`yjs:${docId}`);
  });
}
