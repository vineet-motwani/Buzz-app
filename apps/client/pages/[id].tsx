import { useRouter } from "next/router";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import Image from "next/image";
import { BsArrowLeftShort } from "react-icons/bs";
import { useCurrentUser, useGetUserById, useFollowUser, useUnfollowUser } from "@/hooks/user";
import FeedCard from "@/components/FeedCard";
import { Tweet, User } from "@/gql/graphql";
import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

const UserProfilePage = () => {
  const router = useRouter();
  const { id } = router.query; // Get the ID from the URL
  const { user: currentUser } = useCurrentUser();
  const { user, isLoading } = useGetUserById(id as string);
  const { mutate: followUser } = useFollowUser();
  const { mutate: unfollowUser } = useUnfollowUser();
  
  const queryClient = useQueryClient();

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

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user && !isLoading) {
    return <div>User not found.</div>;
  }

  return (
    <div>
      <BuzzLayout>
        <div>
          <nav className="flex items-center gap-3 py-3 px-3">
            <BsArrowLeftShort 
              className="text-4xl cursor-pointer" 
              onClick={handleBack} 
            />
            <div>
              <h1 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <h1 className="text-md font-bold text-slate-500">
                {user?.tweets?.length} Buzzes
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
            <div className="flex justify-between items-center">
              <div className="flex gap-4 mt-2 text-sm text-gray-400">
                <span>{user?.followers?.length} followers</span>
                <span>{user?.following?.length} following</span>
              </div>
              {currentUser?.id !== user?.id && (
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
            {user?.tweets?.map((tweet) => (
              <FeedCard data={tweet as Tweet} key={tweet?.id} />
            ))}
          </div>
        </div>
      </BuzzLayout>
    </div>
  );
};


export default UserProfilePage;