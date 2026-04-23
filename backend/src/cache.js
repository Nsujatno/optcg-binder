const globalForCache = globalThis;

function getCacheStore() {
    if (!globalForCache.__onePieceBinderBackendCache) {
        globalForCache.__onePieceBinderBackendCache = new Map();
    }

    return globalForCache.__onePieceBinderBackendCache;
}

export async function withCache(key, ttlMs, loader) {
    const store = getCacheStore();
    const cached = store.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    try {
        const value = await loader();
        store.set(key, {
            expiresAt: now + ttlMs,
            value
        });
        return value;
    } catch (error) {
        if (cached) {
            return cached.value;
        }
        throw error;
    }
}
