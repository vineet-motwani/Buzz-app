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
  const suffix = id.substring(0, 4);
  return last ? `${first}-${last}-${suffix}` : `${first}-${suffix}`;
}

class UserService {
  public static async verifyGoogleAuthToken(token: string) {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken);

    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthURL.toString(),
      {
        responseType: "json",
      }
    );

    const user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      const newUser = await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageURL: data.picture,
        },
      });
      // Generate and set username using the auto-generated CUID
      const username = generateUsername(
        data.given_name,
        data.family_name,
        newUser.id
      );
      await prismaClient.user.update({
        where: { id: newUser.id },
        data: { username },
      });
    }

    const userInDb = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!userInDb) throw new Error("User with email not found");

    const userToken = JWTService.generateTokenForUser(userInDb);

    return userToken;
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
