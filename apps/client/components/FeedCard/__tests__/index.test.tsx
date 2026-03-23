import React from "react";
import { render, screen } from "@testing-library/react";
import FeedCard from "../index";
import { Tweet } from "@/gql/graphql";

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

describe("FeedCard", () => {
  const mockTweet: Partial<Tweet> = {
    id: "tweet-1",
    content: "This is a test buzz",
    author: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      profileImageURL: "https://example.com/avatar.png",
    },
    imageURL: "https://example.com/tweet-image.png",
  };

  it("should render the tweet content correctly", () => {
    render(<FeedCard data={mockTweet as Tweet} />);
    expect(screen.getByText("This is a test buzz")).toBeInTheDocument();
  });

  it("should render the author's name", () => {
    render(<FeedCard data={mockTweet as Tweet} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render the author's profile image", () => {
    render(<FeedCard data={mockTweet as Tweet} />);
    const avatar = screen.getByAltText("user profile image");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("should render the tweet image if provided", () => {
    render(<FeedCard data={mockTweet as Tweet} />);
    const tweetImage = screen.getByAltText("Buzz image");
    expect(tweetImage).toBeInTheDocument();
    expect(tweetImage).toHaveAttribute("src", "https://example.com/tweet-image.png");
  });

  it("should not render an image if not provided", () => {
    const tweetNoImage = { ...mockTweet, imageURL: null };
    render(<FeedCard data={tweetNoImage as Tweet} />);
    expect(screen.queryByAltText("Buzz image")).not.toBeInTheDocument();
  });
});
