import { useCurrentUser } from "@/hooks/user";
import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import { BiHash, BiHomeCircle, BiMoney, BiUser } from "react-icons/bi";
import { BsBell, BsBookmark, BsEnvelope } from "react-icons/bs";
import { SiBuzzfeed } from "react-icons/si";
import { SlOptions } from "react-icons/sl";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { graphqlClient } from "@/clients/api";
import { verifyUserGoogleTokenQuery } from "@/graphql/query/user";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";

interface BuzzSidebarButton {
  title: string;
  icon: React.ReactNode;
  link: string;
}

interface BuzzLayoutProps {
  children: React.ReactNode;
}

const BuzzLayout: React.FC<BuzzLayoutProps> = (props) => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const sidebarMenuItems: BuzzSidebarButton[] = useMemo(
    () => [
      {
        title: "Home",
        icon: <BiHomeCircle />,
        link: "/",
      },
      {
        title: "Explore",
        icon: <BiHash />,
        link: "/explore",
      },
      {
        title: "Notifications",
        icon: <BsBell />,
        link: "/notifications",
      },
      {
        title: "Bookmarks",
        icon: <BsBookmark />,
        link: "/bookmarks",
      },
      {
        title: "Profile",
        icon: <BiUser />,
        link: user?.username ? `/${user.username}` : "/",
      },
    ],
    [user?.id, user?.username]
  );

  const handleLoginWithGoogle = useCallback(
    async (cred: CredentialResponse) => {
      const googleToken = cred.credential;
      if (!googleToken) return toast.error(`Google token not found`);

      try {
        const { verifyGoogleToken } = await graphqlClient.request(
          verifyUserGoogleTokenQuery,
          { token: googleToken }
        );

        if (!verifyGoogleToken) {
          toast.error("Authentication failed, please logout and try again.");
          return;
        }

        // Token is now stored as httpOnly cookie by the server.
        // For the immediate refetch, pass the JWT as a header since
        // the browser may not have processed the Set-Cookie yet
        // (cross-origin cookie timing issue in production).
        toast.success("Verified Success");
        graphqlClient.setHeader("Authorization", `Bearer ${verifyGoogleToken}`);
        await queryClient.refetchQueries({ queryKey: ["current-user"] });
        // Clear the temp header — subsequent requests use the httpOnly cookie
        graphqlClient.setHeader("Authorization", "");
      } catch (error) {
        toast.error("Login failed. Please try again.");
      }
    },
    [queryClient]
  );

  return (
    <div>
      {/*
        Grid breakdown (Twitter-style collapse order):
        xl  (≥1280): left 3 (icons+labels) | center 6 | right 3
        lg  (≥1024): left 1 (icons only)    | center 8 | right 3   ← labels vanish first
        md  (≥768):  left 1 (icons only)    | center 11 | right 0  ← right sidebar vanishes second
        <md:         left 1 (icons only)    | center 11 | right 0
      */}
      <div className="grid grid-cols-12 max-w-[1280px] mx-auto">
        {/* ── Left sidebar ── */}
        <div className="col-span-1 xl:col-span-3 pt-1 flex justify-center xl:justify-end pr-0 xl:pr-4 relative sticky top-0 h-screen">
          <div>
            <Link href="/">
              <div className="text-2xl h-fit w-fit hover:bg-gray-800 rounded-full p-4 cursor-pointer transition-all">
                <SiBuzzfeed />
              </div>
            </Link>
            <div className="mt-1 text-xl">
              <ul>
                {sidebarMenuItems.map((item) => {
                  const isActive =
                    router.asPath === encodeURI(item.link) ||
                    router.pathname === item.link;
                  return (
                    <li key={item.title}>
                      <Link
                        className="flex justify-center xl:justify-start items-center gap-4 hover:bg-gray-800 rounded-full px-3 py-3 w-fit cursor-pointer mt-2"
                        href={item.link}
                      >
                        <span className="text-3xl">{item.icon}</span>
                        <span
                          className={`hidden xl:inline ${
                            isActive ? "font-bold" : ""
                          }`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 px-3">
                <Link href="/">
                  <button className="hidden xl:block bg-[#1d9bf0] font-semibold text-lg py-2 px-4 rounded-full w-full">
                    Buzz
                  </button>
                </Link>
                <Link href="/">
                  <button className="block xl:hidden bg-[#1d9bf0] font-semibold text-lg p-3 rounded-full">
                    <SiBuzzfeed />
                  </button>
                </Link>
              </div>
            </div>
          </div>
          {user && (
            <div className="absolute bottom-5 flex gap-2 items-center bg-slate-800 px-3 py-2 rounded-full">
              {user.profileImageURL && (
                <Image
                  className="rounded-full"
                  src={user.profileImageURL}
                  alt="user-image"
                  height={50}
                  width={50}
                />
              )}
              <div className="hidden xl:block">
                <h3 className="text-base font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                  {user.firstName} {user.lastName}
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* ── Center feed ── */}
        <div className="col-span-11 lg:col-span-8 xl:col-span-6 border-r-[1px] border-l-[1px] min-h-screen border-gray-600">
          {props.children}
        </div>

        {/* ── Right sidebar ── */}
        <div className="hidden lg:block lg:col-span-3 p-5 sticky top-0 h-screen overflow-y-auto">
          {!user ? (
            <div className="p-5 bg-slate-700 rounded-lg">
              <h1 className="my-2 text-2xl">New to Buzz?</h1>
              <GoogleLogin onSuccess={handleLoginWithGoogle} />
            </div>
          ) : (
            <div className="px-4 py-3 bg-slate-800 rounded-lg">
              <h1 className="my-2 text-2xl mb-5">Users you may know</h1>
              {user?.recommendedUsers?.map((el: NonNullable<typeof user.recommendedUsers>[number]) => (
                <div className="flex items-center gap-3 mt-2" key={el?.id}>
                  {el?.profileImageURL && (
                    <Image
                      src={el?.profileImageURL}
                      alt="user-image"
                      className="rounded-full"
                      width={60}
                      height={60}
                    />
                  )}
                  <div>
                    <div className="text-lg">
                      {el?.firstName} {el?.lastName}
                    </div>
                    <Link
                      href={`/${el?.username}`}
                      className="bg-white text-black text-sm px-5 py-1 w-full rounded-lg"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuzzLayout;