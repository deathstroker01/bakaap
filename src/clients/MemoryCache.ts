import NodeCache from "node-cache";

export class MemoryCache {
    public client: NodeCache;

    constructor({ client }: { client?: NodeCache }) {
        if (client) this.client = client;
        else this.client = new NodeCache({ stdTTL: 250 });
        
        console.log("[MEMORY CACHE] Cache inititated!");
    }

    setItem(key: NodeCache.Key, value: string | number | Buffer) {
        return this.client.set(key, value);
    }

    getItem(key: NodeCache.Key) {
        return this.client.get(key);
    }

    deleteItem(key: NodeCache.Key) {
        return this.client.del(key);
    }
}
