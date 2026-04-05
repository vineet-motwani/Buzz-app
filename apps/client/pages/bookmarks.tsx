import React from "react";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import { useCurrentUser } from "@/hooks/user";
import FeedCard from "@/components/FeedCard";
import { Buzz } from "@/gql/graphql";

export default function Bookmarks() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <BuzzLayout>
        <div className="p-5 text-gray-500">Loading...</div>
      </BuzzLayout>
    );
  }

  return (
    <div>
      <BuzzLayout>
        <div className="p-5 border-b border-gray-600">
          <h1 className="text-2xl font-bold">Bookmarks</h1>
        </div>
        <div>
          {!user?.bookmarks || user.bookmarks.length === 0 ? (
            <div className="p-5 text-gray-500">No bookmarks yet.</div>
          ) : (
            user.bookmarks.map(
              (bookmark) =>
                bookmark?.buzz && (
                  <FeedCard key={bookmark.id} data={bookmark.buzz as Buzz} />
                )
            )
          )}
        </div>
      </BuzzLayout>
    </div>
  );
}
