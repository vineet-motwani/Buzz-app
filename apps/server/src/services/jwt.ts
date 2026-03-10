import JWT from "jsonwebtoken";
import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";


const JWT_SECRET = "vinee@secret";

export default class JWTService {
    public static generateTokenForUser(user: User) {
        const payload: JWTUser = {
            id: user?.id,
            email: user?.email,
        }
        const token = JWT.sign(payload, JWT_SECRET as string);
        return token;
    }
    public static decodeToken(token: string) {
        try {
            return JWT.verify(token, JWT_SECRET) as JWTUser;
        } catch(error) {
            return null;
        }
    }
}