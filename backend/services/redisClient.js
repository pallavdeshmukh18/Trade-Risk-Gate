import Redis from "ioredis";

const redisEnabled = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      };

const redis = redisEnabled ? new Redis(redisConfig) : null;

if (redis) {
    redis.on("error", (err) => {
        console.error("Error:", err.message);
    });
}

export async function safeRedisGet(key) {
    if (!redis) {
        return null;
    }

    try {
        return await redis.get(key);
    } catch (err) {
        console.error("Error:", err.message);
        return null;
    }
}

export async function safeRedisSet(key, value, ...args) {
    if (!redis) {
        return null;
    }

    try {
        return await redis.set(key, value, ...args);
    } catch (err) {
        console.error("Error:", err.message);
        return null;
    }
}

export default redis;
