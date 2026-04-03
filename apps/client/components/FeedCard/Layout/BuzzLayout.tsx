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
        link: user?.id ? `/${user.firstName}-${user.lastName}` : "/",
      },
    ],
    [user?.id, user?.firstName, user?.lastName]
  );

  const handleLoginWithGoogle = useCallback(
    async (cred: CredentialResponse) => {
      const googleToken = cred.credential;
      if (!googleToken) return toast.error(`Google token not found`);

      const { verifyGoogleToken } = await graphqlClient.request(
        verifyUserGoogleTokenQuery,
        { token: googleToken }
      );

      toast.success("Verified Success");
      console.log(verifyGoogleToken);

      if (verifyGoogleToken)
        window.localStorage.setItem("__buzz_token", verifyGoogleToken);

      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    [queryClient]
  );

  return (
    <div>
      <div className="grid grid-cols-12 w-screen sm:px-56">
        <div className="col-span-2 sm:col-span-2 pt-1 flex sm:justify-end pr-4 relative sticky top-0 h-screen">
          <div>
            <Link href="/">
              <div className="text-2xl h-fit w-fit hover:bg-gray-800 rounded-full p-4 cursor-pointer transition-all">
                <SiBuzzfeed />
              </div>
            </Link>
            <div className="mt-1 text-xl pr-4">
              <ul>
                {sidebarMenuItems.map((item) => {
                  const isActive =
                    router.asPath === encodeURI(item.link) ||
                    router.pathname === item.link;
                  return (
                    <li key={item.title}>
                      <Link
                        className="flex justify-start items-center gap-4 hover:bg-gray-800 rounded-full px-3 py-3 w-fit cursor-pointer mt-2"
                        href={item.link}
                      >
                        <span className=" text-3xl">{item.icon}</span>
                        <span
                          className={`hidden sm:inline ${
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
                  <button className="hidden sm:block bg-[#1d9bf0] font-semibold text-lg py-2 px-4 rounded-full w-full">
                    Buzz
                  </button>
                </Link>
                <Link href="/">
                  <button className="block sm:hidden bg-[#1d9bf0] font-semibold text-lg py-2 px-4 rounded-full w-full">
                    <SiBuzzfeed />
                  </button>
                </Link>
              </div>
            </div>
          </div>
          {user && (
            <div className="absolute bottom-5 flex gap-2 items-center bg-slate-800 px-3 py-2 rounded-full">
              {user && user.profileImageURL && (
                <Image
                  className="rounded-full"
                  src={user?.profileImageURL}
                  alt="user-image"
                  height={50}
                  width={50}
                />
              )}
              <div className="hidden sm:block min-w-[225px]">
                <h3 className="text-base font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.firstName} {user.lastName}
                </h3>
              </div>
            </div>
          )}
        </div>
        <div className="col-span-10 sm:col-span-7 border-r-[1px] border-l-[1px] min-h-screen border-gray-600">
          {props.children}
        </div>
        <div className="col-span-0 sm:col-span-3 p-5 sticky top-0 h-screen overflow-y-auto hidden sm:block">
          {!user ? (
            <div className="p-5 bg-slate-700 rounded-lg">
              <h1 className="my-2 text-2xl">New to Buzz?</h1>
              <GoogleLogin onSuccess={handleLoginWithGoogle} />
            </div>
          ) : (
            <div className="px-4 py-3 bg-slate-800 rounded-lg">
              <h1 className="my-2 text-2xl mb-5">Users you may know</h1>
              {user?.recommendedUsers?.map((el) => (
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
                      href={`/${el?.id}`}
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