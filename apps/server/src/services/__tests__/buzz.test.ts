import BuzzService from "../buzz";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";

// Mocking the clients
jest.mock("../../clients/db", () => ({
  prismaClient: {
    buzz: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../../clients/redis", () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

describe("BuzzService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBuzz", () => {
    const payload = {
      content: "Hello world",
      imageURL: "http://test.com",
      userId: "user-1",
    };

    it("should throw an error if rate limited", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("1");
      await expect(BuzzService.createBuzz(payload)).rejects.toThrow("Please wait....");
    });

    it("should create a buzz if not rate limited", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.buzz.create as jest.Mock).mockResolvedValue({ id: "buzz-1", ...payload });

      const buzz = await BuzzService.createBuzz(payload);

      expect(buzz).toBeDefined();
      expect(prismaClient.buzz.create).toHaveBeenCalledWith({
        data: {
          content: payload.content,
          imageURL: payload.imageURL,
          author: { connect: { id: payload.userId } },
        },
      });
      expect(redisClient.setex).toHaveBeenCalledWith(`RATE_LIMIT:BUZZ:${payload.userId}`, 10, 1);
      expect(redisClient.del).toHaveBeenCalledWith("ALL_BUZZS");
    });
  });

  describe("getAllBuzzs", () => {
    it("should return cached buzzs if available", async () => {
      const cached = JSON.stringify([{ id: "1", content: "Cached" }]);
      (redisClient.get as jest.Mock).mockResolvedValue(cached);

      const buzzs = await BuzzService.getAllBuzzs();
      expect(buzzs).toHaveLength(1);
      expect(buzzs[0].content).toBe("Cached");
      expect(prismaClient.buzz.findMany).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache if no cache exists", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.buzz.findMany as jest.Mock).mockResolvedValue([{ id: "2", content: "DB Buzz" }]);

      const buzzs = await BuzzService.getAllBuzzs();
      expect(buzzs).toHaveLength(1);
      expect(buzzs[0].content).toBe("DB Buzz");
      expect(redisClient.set).toHaveBeenCalled();
    });
  });
});
