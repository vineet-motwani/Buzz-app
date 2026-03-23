import JWT from "jsonwebtoken";
import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";


const JWT_SECRET = process.env.JWT_SECRET;

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
            const decoded = JWT.verify(token, JWT_SECRET as string) as any;
            return {
                id: decoded.id,
                email: decoded.email,
            } as JWTUser;
        } catch(error) {
            return null;
        }
    }
}