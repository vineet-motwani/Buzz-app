import React from "react";
import { render, screen } from "@testing-library/react";
import FeedCard from "../index";
import { Buzz } from "@/gql/graphql";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "mocked image"} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock graphql client (brings in ESM graphql-request)
jest.mock("@/clients/api", () => ({
  graphqlClient: { request: jest.fn() },
}));

// Mock gql tag function
jest.mock("@/gql", () => ({
  graphql: jest.fn(() => ({})),
}));

// Mock react-query
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), loading: jest.fn() },
}));

describe("FeedCard", () => {
  const mockBuzz: Partial<Buzz> = {
    id: "buzz-1",
    content: "This is a test buzz",
    author: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      profileImageURL: "https://example.com/avatar.png",
      email: "test@example.com",
    },
    imageURL: "https://example.com/buzz-image.png",
  };

  it("should render the buzz content correctly", () => {
    render(<FeedCard data={mockBuzz as Buzz} />);
    expect(screen.getByText("This is a test buzz")).toBeInTheDocument();
  });

  it("should render the author's name", () => {
    render(<FeedCard data={mockBuzz as Buzz} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render the author's profile image", () => {
    render(<FeedCard data={mockBuzz as Buzz} />);
    const avatar = screen.getByAltText("user profile image");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("should render the buzz image if provided", () => {
    render(<FeedCard data={mockBuzz as Buzz} />);
    const buzzImage = screen.getByAltText("Buzz image");
    expect(buzzImage).toBeInTheDocument();
    expect(buzzImage).toHaveAttribute("src", "https://example.com/buzz-image.png");
  });

  it("should not render an image if not provided", () => {
    const buzzNoImage = { ...mockBuzz, imageURL: null };
    render(<FeedCard data={buzzNoImage as Buzz} />);
    expect(screen.queryByAltText("Buzz image")).not.toBeInTheDocument();
  });
});
