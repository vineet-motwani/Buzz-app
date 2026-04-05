import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await UserService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => UserService.getUserById(id),
  getUserByUsername: async (
    parent: any,
    { username }: { username: string },
    ctx: GraphqlContext
  ) => UserService.getUserByUsername(username),
  getSignedURLForProfileImage: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");

    const allowedImageTypes = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(imageType))
      throw new Error("Unsupported Image Type");

    // Rate limit: 5 profile image uploads per minute
    const limitKey = `SIGNED_URL_LIMIT:PROFILE:${ctx.user.id}`;
    const count = await redisClient.incr(limitKey);
    if (count === 1) await redisClient.expire(limitKey, 60);
    if (count > 5) throw new Error("Too many upload requests. Try again shortly.");

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      ContentType: imageType,
      Key: `uploads/${ctx.user.id}/profile/${sanitizeFileName(imageName)}-${Date.now()}`,
    });

    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
  },
};

const extraResolvers = {
  User: {
    buzzs: (parent: User) =>
      prismaClient.buzz.findMany({ where: { author: { id: parent.id } } }),
    notifications: (parent: User) =>
      prismaClient.notification.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: "desc" },
      }),
    bookmarks: (parent: User) =>
      prismaClient.bookmark.findMany({
        where: { userId: parent.id },
        include: { buzz: true },
        orderBy: { createdAt: "desc" },
      }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: { follower: true },
      });
      return result.map((el) => el.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: { following: true },
      });
      return result.map((el) => el.following);
    },
    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];

      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );

      if (cachedValue) {
        return JSON.parse(cachedValue);
      }

      const myFollowings = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });

      const myFollowingIds = new Set(myFollowings.map((f) => f.followingId));
      const recommended = new Map<string, User>();

      for (const followings of myFollowings) {
        for (const fof of followings.following.followers) {
          const candidate = fof.following;
          if (
            candidate.id !== ctx.user.id &&
            !myFollowingIds.has(candidate.id)
          ) {
            recommended.set(candidate.id, candidate);
          }
        }
      }

      const users = Array.from(recommended.values());

      await redisClient.set(
        `RECOMMENDED_USERS:${ctx.user.id}`,
        JSON.stringify(users)
      );

      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    if (ctx.user.id === to) throw new Error("You cannot follow yourself");

    try {
      await UserService.followUser(ctx.user.id, to);
    } catch (error: any) {
      if (error.code === "P2002")
        throw new Error("Already following this user");
      if (error.code === "P2025") throw new Error("User not found");
      throw error;
    }

    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");

    try {
      await UserService.unfollowUser(ctx.user.id, to);
    } catch (error: any) {
      if (error.code === "P2025")
        throw new Error("Not currently following this user");
      throw error;
    }

    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  updateUserProfile: async (
    parent: any,
    {
      payload,
    }: {
      payload: {
        firstName?: string;
        lastName?: string;
        profileImageURL?: string;
      };
    },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");

    // Input validation
    if (payload.firstName !== undefined) {
      const trimmed = payload.firstName.trim();
      if (trimmed.length === 0)
        throw new Error("First name cannot be empty");
      if (trimmed.length > 100)
        throw new Error("First name exceeds 100 character limit");
      payload.firstName = trimmed;
    }

    if (payload.lastName !== undefined && payload.lastName.length > 100) {
      throw new Error("Last name exceeds 100 character limit");
    }

    if (payload.profileImageURL !== undefined) {
      try {
        new URL(payload.profileImageURL);
      } catch {
        throw new Error("Profile image URL is not valid");
      }
    }

    return UserService.updateUserProfile(ctx.user.id, payload);
  },
};

export const resolvers = { queries, extraResolvers, mutations };
