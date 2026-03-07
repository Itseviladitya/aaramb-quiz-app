import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const DEFAULT_CACHE_NAMESPACE = "quizapp:v1";

function getGlobalStore() {
  const globalWithRedis = globalThis;
  if (!globalWithRedis.__quizRedisStore) {
    globalWithRedis.__quizRedisStore = {
      client: null,
      connectPromise: null,
      warned: false,
    };
  }
  return globalWithRedis.__quizRedisStore;
}

function prefixedKey(key) {
  return `${DEFAULT_CACHE_NAMESPACE}:${key}`;
}

function warnRedis(message, error) {
  const store = getGlobalStore();
  if (store.warned) {
    return;
  }
  store.warned = true;
  console.warn(`[redis] ${message}`, error?.message || "");
}

function createRedisClient() {
  return createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy(retries) {
        return Math.min(retries * 50, 1000);
      },
    },
  });
}

export function isRedisEnabled() {
  return Boolean(REDIS_URL);
}

export async function getRedisClient() {
  if (!isRedisEnabled()) {
    return null;
  }

  const store = getGlobalStore();
  if (store.client?.isOpen) {
    return store.client;
  }

  if (!store.client) {
    store.client = createRedisClient();
    store.client.on("error", (error) => {
      warnRedis("Redis client error, falling back to primary DB.", error);
    });
  }

  if (!store.connectPromise) {
    store.connectPromise = store.client
      .connect()
      .catch((error) => {
        warnRedis("Redis connection failed, using fallback mode.", error);
        return null;
      })
      .finally(() => {
        store.connectPromise = null;
      });
  }

  await store.connectPromise;
  return store.client?.isOpen ? store.client : null;
}

export async function getJsonCache(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }

    const value = await client.get(prefixedKey(key));
    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    warnRedis("Failed to read cache key.", error);
    return null;
  }
}

export async function setJsonCache(key, value, ttlSeconds) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    const payload = JSON.stringify(value);
    const namespaced = prefixedKey(key);

    if (ttlSeconds) {
      await client.set(namespaced, payload, { EX: ttlSeconds });
    } else {
      await client.set(namespaced, payload);
    }

    return true;
  } catch (error) {
    warnRedis("Failed to set cache key.", error);
    return false;
  }
}

export async function deleteByPrefix(prefix) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return 0;
    }

    const pattern = prefixedKey(`${prefix}*`);
    const keys = [];

    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }

    if (!keys.length) {
      return 0;
    }

    return client.del(keys);
  } catch (error) {
    warnRedis("Failed to delete cache keys by prefix.", error);
    return 0;
  }
}

export async function rateLimit({ key, limit, windowSeconds }) {
  try {
    const client = await getRedisClient();
    if (!client) {
      // Fail-open so existing behavior remains unchanged when Redis is unavailable.
      return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetInSeconds: 0 };
    }

    const namespaced = prefixedKey(`rl:${key}`);
    const tx = client.multi();
    tx.incr(namespaced);
    tx.ttl(namespaced);
    const result = await tx.exec();

    const current = Number(result?.[0] ?? 0);
    const ttl = Number(result?.[1] ?? -1);

    if (current === 1 || ttl < 0) {
      await client.expire(namespaced, windowSeconds);
    }

    const resetInSeconds = ttl > 0 ? ttl : windowSeconds;
    const allowed = current <= limit;

    return {
      allowed,
      remaining: Math.max(limit - current, 0),
      resetInSeconds,
    };
  } catch (error) {
    warnRedis("Rate limiter failed, allowing request.", error);
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetInSeconds: 0 };
  }
}
