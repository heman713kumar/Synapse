// Quick module-stub declarations for third-party packages that ship
// JS without TypeScript types. Lets ts-node compile in dev without
// `npm i --save-dev @types/*`.

declare module 'y-leveldb' {
  // Minimal shape — full class lives in node_modules, this just lets ts-node
  // accept `new LeveldbPersistence(...)` and `: LeveldbPersistence`.
  export class LeveldbPersistence {
    constructor(location: string);
    getYDoc(name: string): Promise<any>;
    storeUpdate(name: string, update: Uint8Array): Promise<any>;
    clearDocument(name: string): Promise<void>;
    destroy(): Promise<void>;
  }
}
