import JWTService from "../jwt";
import { User } from "@prisma/client";

describe("JWTService", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    profileImageURL: "https://example.com/image.png",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should correctly generate a token for a user", () => {
    const token = JWTService.generateTokenForUser(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("should correctly decode a valid token", () => {
    const token = JWTService.generateTokenForUser(mockUser);
    const decoded = JWTService.decodeToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.email).toBe(mockUser.email);
  });

  it("should return null for an invalid token", () => {
    const decoded = JWTService.decodeToken("invalid-token");
    expect(decoded).toBeNull();
  });
});
