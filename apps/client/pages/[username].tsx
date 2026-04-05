import { useRouter } from "next/router";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import Image from "next/image";
import { BsArrowLeftShort } from "react-icons/bs";
import Link from "next/link";
import { useCurrentUser, useGetUserByUsername, useFollowUser, useUnfollowUser } from "@/hooks/user";
import FeedCard from "@/components/FeedCard";
import { Buzz } from "@/gql/graphql";
import { useCallback, useMemo } from "react";

const UserProfilePage = () => {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useCurrentUser();
  const { user, isLoading } = useGetUserByUsername(username as string);
  const { mutate: followUser } = useFollowUser();
  const { mutate: unfollowUser } = useUnfollowUser();

  const amIFollowing = useMemo(() => {
    if (!user) return false;
    return (
      (currentUser?.following?.findIndex(
        (el) => el?.id === user?.id
      ) ?? -1) >= 0
    );
  }, [currentUser?.following, user]);

  const handleFollowUser = useCallback(async () => {
    if (!user?.id) return;
    followUser(user.id);
  }, [user?.id, followUser]);

  const handleUnfollowUser = useCallback(async () => {
    if (!user?.id) return;
    unfollowUser(user.id);
  }, [user?.id, unfollowUser]);

  const isOwnProfile = currentUser?.id === user?.id;

  if (isLoading) {
    return (
      <BuzzLayout>
        <div className="p-10 text-center text-gray-400">Loading...</div>
      </BuzzLayout>
    );
  }

  if (!user && !isLoading) {
    return (
      <BuzzLayout>
        <div className="p-10 text-center text-gray-400">User not found.</div>
      </BuzzLayout>
    );
  }

  return (
    <div>
      <BuzzLayout>
        <div>
          <nav className="flex items-center gap-3 py-3 px-3">
            <BsArrowLeftShort
              className="text-4xl cursor-pointer"
              onClick={() => router.push("/")}
            />
            <div>
              <h1 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <h1 className="text-md font-bold text-slate-500">
                {user?.buzzs?.length} Buzzes
              </h1>
            </div>
          </nav>
          <div className="p-4 border-b border-slate-800">
            {user?.profileImageURL && (
              <Image
                src={user.profileImageURL}
                alt="user-image"
                className="rounded-full"
                width={100}
                height={100}
              />
            )}
            <h1 className="text-2xl font-bold mt-5">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-gray-500">@{user?.username}</p>
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{user?.followers?.length} followers</span>
                <span>{user?.following?.length} following</span>
              </div>
              {isOwnProfile ? (
                <Link
                  href="/edit-profile"
                  className="border border-gray-500 text-white px-4 py-1 rounded-full text-sm hover:bg-gray-800 transition-colors"
                >
                  Edit profile
                </Link>
              ) : (
                <>
                  {amIFollowing ? (
                    <button
                      onClick={handleUnfollowUser}
                      className="bg-white text-black px-3 py-1 rounded-full text-sm"
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowUser}
                      className="bg-white text-black px-3 py-1 rounded-full text-sm"
                    >
                      Follow
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            {user?.buzzs?.map((buzz) => (
              <FeedCard data={buzz as Buzz} key={buzz?.id} />
            ))}
          </div>
        </div>
      </BuzzLayout>
    </div>
  );
};

export default UserProfilePage;
