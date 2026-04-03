import { Buzz } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GraphqlContext } from "../../interfaces";
import UserService from "../../services/user";
import BuzzService, { CreateBuzzPayload } from "../../services/buzz";
import { prismaClient } from "../../clients/db";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

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

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      ContentType: imageType,
      Key: `uploads/${ctx.user.id}/buzzs/${imageName}-${Date.now()}`,
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
    
    // Check if the like already exists
    const existingLike = await prismaClient.like.findUnique({
      where: {
        buzzId_userId: {
          buzzId,
          userId: ctx.user.id,
        },
      },
    });

    if (existingLike) {
      await prismaClient.like.delete({
        where: {
          buzzId_userId: {
            buzzId,
            userId: ctx.user.id,
          },
        },
      });
      return false; // Indicating unliked
    } else {
      await prismaClient.like.create({
        data: {
          buzzId,
          userId: ctx.user.id,
        },
      });

      // Fetch the buzz to find the author
      const buzz = await prismaClient.buzz.findUnique({
        where: { id: buzzId },
        include: { author: true },
      });

      // Create notification for the author if it's not the user's own buzz
      if (buzz && buzz.authorId !== ctx.user.id) {
        const likingUser = await prismaClient.user.findUnique({ where: { id: ctx.user.id } });
        if (likingUser) {
          await prismaClient.notification.create({
            data: {
              userId: buzz.authorId,
              content: `${likingUser.firstName} liked your buzz`,
            },
          });
        }
      }
      return true; // Indicating liked
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
        buzzId_userId: {
          buzzId,
          userId: ctx.user.id,
        },
      },
    });

    if (existingBookmark) {
      await prismaClient.bookmark.delete({
        where: {
          buzzId_userId: {
            buzzId,
            userId: ctx.user.id,
          },
        },
      });
      return false; // Indicating unbookmarked
    } else {
      await prismaClient.bookmark.create({
        data: {
          buzzId,
          userId: ctx.user.id,
        },
      });
      return true; // Indicating bookmarked
    }
  },
};

const extraResolvers = {
  Buzz: {
    author: (parent: Buzz) => UserService.getUserById(parent.authorId),
    hasLiked: async (parent: Buzz, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return false;
      const like = await prismaClient.like.findUnique({
        where: { buzzId_userId: { buzzId: parent.id, userId: ctx.user.id } }
      });
      return !!like;
    },
    hasBookmarked: async (parent: Buzz, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return false;
      const bookmark = await prismaClient.bookmark.findUnique({
        where: { buzzId_userId: { buzzId: parent.id, userId: ctx.user.id } }
      });
      return !!bookmark;
    },
  },
};

export const resolvers = { mutations, extraResolvers, queries };
