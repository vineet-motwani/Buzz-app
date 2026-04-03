import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateBuzzPayload {
  content: string;
  imageURL?: string;
  userId: string;
}

class BuzzService {
  public static async createBuzz(data: CreateBuzzPayload) {
    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:BUZZ:${data.userId}`
    );
    if (rateLimitFlag) throw new Error("Please wait....");
    const buzz = await prismaClient.buzz.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        author: { connect: { id: data.userId } },
      },
    });
    await redisClient.setex(`RATE_LIMIT:BUZZ:${data.userId}`, 10, 1);
    await redisClient.del("ALL_BUZZS");
    return buzz;
  }

  public static async getAllBuzzs() {
    const cachedBuzzs = await redisClient.get("ALL_BUZZS");
    if (cachedBuzzs) return JSON.parse(cachedBuzzs);

    const buzzs = await prismaClient.buzz.findMany({
      orderBy: { createdAt: "desc" },
    });
    await redisClient.set("ALL_BUZZS", JSON.stringify(buzzs), "EX", 10);
    return buzzs;
  }
}

export default BuzzService;
