import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";

interface GoogleTokenResult {
  iss?: string;
  nbf?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  azp?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}

function generateUsername(
  firstName: string,
  lastName: string | undefined,
  id: string
): string {
  const first = firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = (lastName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Use the last 8 chars of the ID (random part) instead of the first 4
  // (timestamp prefix) to avoid collisions for users created at similar times
  const suffix = id.slice(-8);
  return last ? `${first}-${last}-${suffix}` : `${first}-${suffix}`;
}

class UserService {
  public static async verifyGoogleAuthToken(token: string) {
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", token);

    let data: GoogleTokenResult;
    try {
      const response = await axios.get<GoogleTokenResult>(
        googleOauthURL.toString(),
        { responseType: "json", timeout: 5000 }
      );
      data = response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("Invalid or expired Google token");
      }
      throw new Error("Google authentication failed");
    }

    if (data.email_verified !== "true") {
      throw new Error("Google email is not verified");
    }

    let user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prismaClient.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
            profileImageURL: data.picture,
          },
        });
        return tx.user.update({
          where: { id: created.id },
          data: {
            username: generateUsername(
              data.given_name,
              data.family_name,
              created.id
            ),
          },
        });
      });
    }

    return JWTService.generateTokenForUser(user);
  }

  public static getUserById(id: string) {
    return prismaClient.user.findUnique({ where: { id } });
  }

  public static getUserByUsername(username: string) {
    return prismaClient.user.findUnique({ where: { username } });
  }

  public static updateUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; profileImageURL?: string }
  ) {
    return prismaClient.user.update({
      where: { id: userId },
      data,
    });
  }

  public static followUser(from: string, to: string) {
    return prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
  }

  public static unfollowUser(from: string, to: string) {
    return prismaClient.follows.delete({
      where: { followerId_followingId: { followerId: from, followingId: to } },
    });
  }
}

export default UserService;
