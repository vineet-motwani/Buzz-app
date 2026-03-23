import TweetService from "../tweet";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";

// Mocking the clients
jest.mock("../../clients/db", () => ({
  prismaClient: {
    tweet: {
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

describe("TweetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTweet", () => {
    const payload = {
      content: "Hello world",
      imageURL: "http://test.com",
      userId: "user-1",
    };

    it("should throw an error if rate limited", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue("1");
      await expect(TweetService.createTweet(payload)).rejects.toThrow("Please wait....");
    });

    it("should create a tweet if not rate limited", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.tweet.create as jest.Mock).mockResolvedValue({ id: "tweet-1", ...payload });

      const tweet = await TweetService.createTweet(payload);

      expect(tweet).toBeDefined();
      expect(prismaClient.tweet.create).toHaveBeenCalledWith({
        data: {
          content: payload.content,
          imageURL: payload.imageURL,
          author: { connect: { id: payload.userId } },
        },
      });
      expect(redisClient.setex).toHaveBeenCalledWith(`RATE_LIMIT:TWEET:${payload.userId}`, 10, 1);
      expect(redisClient.del).toHaveBeenCalledWith("ALL_TWEETS");
    });
  });

  describe("getAllTweets", () => {
    it("should return cached tweets if available", async () => {
      const cached = JSON.stringify([{ id: "1", content: "Cached" }]);
      (redisClient.get as jest.Mock).mockResolvedValue(cached);

      const tweets = await TweetService.getAllTweets();
      expect(tweets).toHaveLength(1);
      expect(tweets[0].content).toBe("Cached");
      expect(prismaClient.tweet.findMany).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache if no cache exists", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.tweet.findMany as jest.Mock).mockResolvedValue([{ id: "2", content: "DB Tweet" }]);

      const tweets = await TweetService.getAllTweets();
      expect(tweets).toHaveLength(1);
      expect(tweets[0].content).toBe("DB Tweet");
      expect(redisClient.set).toHaveBeenCalled();
    });
  });
});
