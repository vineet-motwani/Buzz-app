import { Buzz } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GraphqlContext } from "../../interfaces";
import UserService from "../../services/user";
import BuzzService, { CreateBuzzPayload } from "../../services/buzz";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

// Sanitize user-supplied file names to prevent S3 path traversal
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const queries = {
  getAllBuzzs: () => BuzzService.getAllBuzzs(),
  getSignedURLForBuzz: async (
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

    // Rate limit: 10 signed URLs per minute
    const limitKey = `SIGNED_URL_LIMIT:BUZZ:${ctx.user.id}`;
    const count = await redisClient.incr(limitKey);
    if (count === 1) await redisClient.expire(limitKey, 60);
    if (count > 10) throw new Error("Too many upload requests. Try again shortly.");

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      ContentType: imageType,
      Key: `uploads/${ctx.user.id}/buzzs/${sanitizeFileName(imageName)}-${Date.now()}`,
    });

    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
  },
};

const mutations = {
  createBuzz: async (
    parent: any,
    { payload }: { payload: CreateBuzzPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated");

    // Input validation
    if (!payload.content || payload.content.trim().length === 0) {
      throw new Error("Buzz content cannot be empty");
    }
    if (payload.content.length > 500) {
      throw new Error("Buzz content exceeds 500 character limit");
    }

    const buzz = await BuzzService.createBuzz({
      ...payload,
      userId: ctx.user.id,
    });

    return buzz;
  },
  likeBuzz: async (
    parent: any,
    { buzzId }: { buzzId: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated");

    const existingLike = await prismaClient.like.findUnique({
      where: {
        buzzId_userId: { buzzId, userId: ctx.user.id },
      },
    });

    if (existingLike) {
      await prismaClient.like.delete({
        where: {
          buzzId_userId: { buzzId, userId: ctx.user.id },
        },
      });
      return false;
    } else {
      await prismaClient.like.create({
        data: { buzzId, userId: ctx.user.id },
      });

      // Notification — don't let a failure here break the like
      try {
        const [buzz, likingUser] = await Promise.all([
          prismaClient.buzz.findUnique({
            where: { id: buzzId },
            select: { authorId: true },
          }),
          prismaClient.user.findUnique({
            where: { id: ctx.user.id },
            select: { firstName: true },
          }),
        ]);

        if (buzz && buzz.authorId !== ctx.user.id && likingUser) {
          await prismaClient.notification.create({
            data: {
              userId: buzz.authorId,
              content: `${likingUser.firstName} liked your buzz`,
            },
          });
        }
      } catch (err) {
        console.error("Failed to create like notification:", err);
      }

      return true;
    }
  },
  bookmarkBuzz: async (
    parent: any,
    { buzzId }: { buzzId: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated");

    const existingBookmark = await prismaClient.bookmark.findUnique({
      where: {
        buzzId_userId: { buzzId, userId: ctx.user.id },
      },
    });

    if (existingBookmark) {
      await prismaClient.bookmark.delete({
        where: {
          buzzId_userId: { buzzId, userId: ctx.user.id },
        },
      });
      return false;
    } else {
      await prismaClient.bookmark.create({
        data: { buzzId, userId: ctx.user.id },
      });
      return true;
    }
  },
};

const extraResolvers = {
  Buzz: {
    author: (parent: Buzz) => UserService.getUserById(parent.authorId),
    hasLiked: async (parent: Buzz, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return false;
      const like = await prismaClient.like.findUnique({
        where: { buzzId_userId: { buzzId: parent.id, userId: ctx.user.id } },
      });
      return !!like;
    },
    hasBookmarked: async (parent: Buzz, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return false;
      const bookmark = await prismaClient.bookmark.findUnique({
        where: { buzzId_userId: { buzzId: parent.id, userId: ctx.user.id } },
      });
      return !!bookmark;
    },
  },
};

export const resolvers = { mutations, extraResolvers, queries };
