import Redis from "ioredis";

const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
      };

const redis = new Redis(redisConfig);

redis.on("error", (err) => {
    console.error("Error:", err.message);
});

export default redis;
