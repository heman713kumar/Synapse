// Ambient declaration for y-leveldb (no upstream types).
declare module 'y-leveldb' {
  import { Doc } from 'yjs';
  export class LeveldbPersistence {
    constructor(location: string, opts?: any);
    getYDoc(name: string): Promise<Doc>;
    storeUpdate(name: string, update: Uint8Array): Promise<void>;
    flushDocument(name: string): Promise<void>;
    clearDocument(name: string): Promise<void>;
    destroy(): Promise<void>;
  }
}
