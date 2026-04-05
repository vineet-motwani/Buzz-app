import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { BiCamera } from "react-icons/bi";
import { BsArrowLeftShort } from "react-icons/bs";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import { useCurrentUser, useUpdateUserProfile } from "@/hooks/user";
import { graphqlClient } from "@/clients/api";
import { getSignedURLForProfileImageQuery } from "@/graphql/query/user";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { mutateAsync: updateProfile, isPending } = useUpdateUserProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImageURL, setProfileImageURL] = useState("");

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName || "");
      setProfileImageURL(user.profileImageURL || "");
    }
  }, [user]);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.addEventListener("change", async () => {
      const originalFile = input.files?.item(0);
      if (!originalFile) return;

      // Compress jpeg/webp images
      let fileToUpload = originalFile;
      if (
        originalFile.type === "image/jpeg" ||
        originalFile.type === "image/webp"
      ) {
        try {
          const bitmap = await createImageBitmap(originalFile);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, originalFile.type, 0.25)
            );
            if (blob) {
              fileToUpload = new File([blob], originalFile.name, {
                type: originalFile.type,
              });
            }
          }
        } catch {
          console.error("Compression failed, using original file");
        }
      }

      const { getSignedURLForProfileImage } = await graphqlClient.request(
        getSignedURLForProfileImageQuery,
        { imageName: fileToUpload.name, imageType: fileToUpload.type }
      );

      if (getSignedURLForProfileImage) {
        toast.loading("Uploading...", { id: "profile-upload" });
        await axios.put(getSignedURLForProfileImage, fileToUpload, {
          headers: { "Content-Type": fileToUpload.type },
        });
        toast.success("Upload complete!", { id: "profile-upload" });
        const url = new URL(getSignedURLForProfileImage);
        setProfileImageURL(`${url.origin}${url.pathname}`);
      }
    });

    input.click();
  }, []);

  const handleSave = useCallback(async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      profileImageURL: profileImageURL || undefined,
    });
    router.push(`/${user?.username}`);
  }, [firstName, lastName, profileImageURL, updateProfile, router, user?.username]);

  if (!user) {
    return (
      <BuzzLayout>
        <div className="p-10 text-center text-gray-400">
          Please log in to edit your profile.
        </div>
      </BuzzLayout>
    );
  }

  return (
    <div>
      <BuzzLayout>
        <div>
          {/* Header */}
          <nav className="flex items-center gap-3 py-3 px-3 border-b border-gray-700">
            <BsArrowLeftShort
              className="text-4xl cursor-pointer"
              onClick={() => router.back()}
            />
            <h1 className="text-xl font-bold">Edit profile</h1>
          </nav>

          <div className="p-6 space-y-6">
            {/* Profile image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={handleImageUpload}>
                {profileImageURL ? (
                  <Image
                    src={profileImageURL}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full object-cover w-[120px] h-[120px]"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] rounded-full bg-gray-700 flex items-center justify-center text-4xl text-gray-400">
                    {firstName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <BiCamera className="text-3xl text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Click to change photo</p>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <div className="w-full bg-gray-800 text-gray-400 px-4 py-3 rounded-lg border border-gray-700">
                @{user.username}
              </div>
            </div>

            {/* First name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-transparent px-4 py-3 rounded-lg border border-gray-700 focus:border-[#1d9bf0] transition-colors"
                placeholder="First name"
              />
            </div>

            {/* Last name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-transparent px-4 py-3 rounded-lg border border-gray-700 focus:border-[#1d9bf0] transition-colors"
                placeholder="Last name"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full bg-[#1d9bf0] font-semibold py-3 rounded-full hover:bg-[#1a8cd8] transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </BuzzLayout>
    </div>
  );
}
