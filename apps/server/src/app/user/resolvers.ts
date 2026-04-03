import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

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
  getUserByName: async (
    parent: any,
    { name }: { name: string },
    ctx: GraphqlContext
  ) => {
    // If the name is something like "John-Doe", we can split it.
    // Or we could just search by name. For simplicity, let's search users whose firstName + lastName matches.
    // However, Prisma doesn't have an easy concat search without raw query.
    // We will find all users and filter in memory since this is a simple clone.
    const parts = name.split("-");
    const firstName = parts[0];
    const lastName = parts.slice(1).join("-") || undefined;
    
    // Attempt exact match
    let user = await prismaClient.user.findFirst({
      where: lastName ? { firstName, lastName } : { firstName },
    });
    
    // If not found, try searching where firstName contains the full name
    if (!user) {
      user = await prismaClient.user.findFirst({
        where: { firstName: name },
      });
    }

    return user;
  },
};

const extraResolvers = {
  User: {
    buzzs: (parent: User) =>
      prismaClient.buzz.findMany({ where: { author: { id: parent.id } } }),
    notifications: (parent: User) =>
      prismaClient.notification.findMany({ where: { userId: parent.id }, orderBy: { createdAt: 'desc' } }),
    bookmarks: (parent: User) =>
      prismaClient.bookmark.findMany({ where: { userId: parent.id }, include: { buzz: true }, orderBy: { createdAt: 'desc' } }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((el) => el.follower);
    },
    /**
     * Resolves the list of users this user is following.
     */
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((el) => el.following);
    },
    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );

      if (cachedValue) {
        console.log("Cache Found: Returning recommendations from Redis.");
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

      const users: User[] = [];

      for (const followings of myFollowings) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myFollowings.findIndex(
              (e) => e?.followingId === followingOfFollowedUser.following.id
            ) < 0
          ) {
            if (!users.find((u) => u.id === followingOfFollowedUser.following.id)) {
              users.push(followingOfFollowedUser.following);
            }
          }
        }
      }

      console.log("Cache Miss: Storing fresh recommendations in Redis.");
      // Store the result in Redis with a TTL if needed, or invalidate on follow events
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

    await UserService.followUser(ctx.user.id, to);
    // Invalidate the recommendation cache to ensure fresh suggestions
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserService.unfollowUser(ctx.user.id, to);
    // Invalidate cache to reflect the relationship change
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};

export const resolvers = { queries, extraResolvers, mutations };
