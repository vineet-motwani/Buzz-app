import React, { useCallback, useState } from "react";
import Image from "next/image";
import { BiImageAlt } from "react-icons/bi";
import FeedCard from "@/components/FeedCard";
import { useCurrentUser } from "@/hooks/user";
import { useCreateBuzz, useGetAllBuzzs } from "@/hooks/buzz";
import { Buzz } from "@/gql/graphql";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import { graphqlClient } from "@/clients/api";
import { getSignedURLForBuzzQuery } from "@/graphql/query/buzz";
import axios from "axios";
import { toast } from "react-hot-toast";



export default function Home() {
  const { user } = useCurrentUser();
  const { buzzs = [] } = useGetAllBuzzs();
  const { mutateAsync } = useCreateBuzz();

  const [content, setContent] = useState("");
  const [imageURL, setImageURL] = useState("");

  const handleInputChangeFile = useCallback((input: HTMLInputElement) => {
    return async (event: Event) => {
      event.preventDefault();
      const originalFile: File | null | undefined = input.files?.item(0);
      if (!originalFile) return;

      // Simple image compression for jpeg/webp
      let fileToUpload = originalFile;
      if (originalFile.type.startsWith("image/") && (originalFile.type === "image/jpeg" || originalFile.type === "image/webp")) {
        try {
          const bitmap = await createImageBitmap(originalFile);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, originalFile.type, 0.25));
            if (blob) {
              fileToUpload = new File([blob], originalFile.name, { type: originalFile.type });
            }
          }
        } catch (e) {
          console.error("Compression failed, using original file");
        }
      }

      const { getSignedURLForBuzz } = await graphqlClient.request(
        getSignedURLForBuzzQuery,
        {
          imageName: fileToUpload.name,
          imageType: fileToUpload.type,
        }
      );

      if (getSignedURLForBuzz) {
        toast.loading("Uploading...", { id: "2" });
        await axios.put(getSignedURLForBuzz, fileToUpload, {
          headers: { "Content-Type": fileToUpload.type },
        });
        toast.success("Upload Complete!", { id: "2" });
        const url = new URL(getSignedURLForBuzz);
        const myFilePath = `${url.origin}${url.pathname}`;
        setImageURL(myFilePath);
      }
    };
  }, []);

  const handleSelectImage = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    const handlerFn = handleInputChangeFile(input);
    input.addEventListener("change", handlerFn);
    input.click();
  }, [handleInputChangeFile]);

  const handleCreateBuzz = useCallback(async () => {
    await mutateAsync({
      content,
      imageURL,
    });
    setContent("");
    setImageURL("");
  }, [mutateAsync, content, imageURL]);

  return (
    <div>
      <BuzzLayout>
        <div>
          <div className="border border-r-0 border-l-0 border-b-0 border-gray-600 p-5 hover:bg-slate-900 transition-all cursor-pointer">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-1">
                {user?.profileImageURL && (
                  <Image
                    className="rounded-full"
                    src={user.profileImageURL}
                    alt="user-image"
                    height={50}
                    width={50}
                  />
                )}
              </div>
              <div className="col-span-11">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === "Enter") {
                      e.preventDefault();
                      handleCreateBuzz();
                    }
                  }}
                  className="w-full bg-transparent text-xl px-3 border-b border-slate-700"
                  placeholder="Buzz about what's happening..."
                  rows={3}
                ></textarea>
                {imageURL && (
                  <Image
                    src={imageURL}
                    alt="buzz-image"
                    width={300}
                    height={300}
                    className="mt-3 max-h-64 object-contain"
                  />
                )}
                <div className="mt-2 flex justify-between items-center">
                  <BiImageAlt onClick={handleSelectImage} className="text-xl" />
                  <button
                    onClick={handleCreateBuzz}
                    className="bg-[#1d9bf0] font-semibold text-sm py-2 px-4 rounded-full"
                  >
                    Buzz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {buzzs?.map((buzz) =>
          buzz ? <FeedCard key={buzz.id} data={buzz as Buzz} /> : null
        )}
      </BuzzLayout>
    </div>
  );
}
