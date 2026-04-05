import Redis from "ioredis";

export const redisClient = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});
