import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BiImageAlt } from "react-icons/bi";
import { BsEmojiSmile } from "react-icons/bs";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import FeedCard from "@/components/FeedCard";
import { useCurrentUser } from "@/hooks/user";
import { useCreateBuzz, useGetAllBuzzs } from "@/hooks/buzz";
import { Buzz } from "@/gql/graphql";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import { graphqlClient } from "@/clients/api";
import { getSignedURLForBuzzQuery } from "@/graphql/query/buzz";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  getShortcodeQuery,
  searchEmojis,
  tryReplaceShortcodeAtCursor,
  EmojiResult,
} from "@/utils/emojiShortcodes";



export default function Home() {
  const { user } = useCurrentUser();
  const { buzzs = [] } = useGetAllBuzzs();
  const { mutateAsync } = useCreateBuzz();

  const [content, setContent] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);

  // Inline suggestion state
  const [suggestions, setSuggestions] = useState<EmojiResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [shortcodeStart, setShortcodeStart] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Search emojis when content/cursor changes
  useEffect(() => {
    const info = getShortcodeQuery(content, cursorPos);
    if (!info) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    searchEmojis(info.query).then((results) => {
      if (!cancelled) {
        setSuggestions(results);
        setShortcodeStart(info.start);
        setActiveIdx(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [content, cursorPos]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  // ── Image upload ──
  const handleInputChangeFile = useCallback((input: HTMLInputElement) => {
    return async (event: Event) => {
      event.preventDefault();
      const originalFile: File | null | undefined = input.files?.item(0);
      if (!originalFile) return;

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

      const { getSignedURLForBuzz } = await graphqlClient.request(
        getSignedURLForBuzzQuery,
        { imageName: fileToUpload.name, imageType: fileToUpload.type }
      );

      if (getSignedURLForBuzz) {
        toast.loading("Uploading...", { id: "2" });
        await axios.put(getSignedURLForBuzz, fileToUpload, {
          headers: { "Content-Type": fileToUpload.type },
        });
        toast.success("Upload Complete!", { id: "2" });
        const url = new URL(getSignedURLForBuzz);
        setImageURL(`${url.origin}${url.pathname}`);
      }
    };
  }, []);

  const handleSelectImage = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.addEventListener("change", handleInputChangeFile(input));
    input.click();
  }, [handleInputChangeFile]);

  // ── Buzz submission ──
  const handleCreateBuzz = useCallback(async () => {
    await mutateAsync({ content, imageURL });
    setContent("");
    setImageURL("");
    setSuggestions([]);
  }, [mutateAsync, content, imageURL]);

  // ── Emoji insertion (shared by picker + suggestions) ──
  const insertEmoji = useCallback(
    (emoji: string, replaceFrom?: number) => {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? content.length;
      const start = replaceFrom ?? cursor;
      const newContent =
        content.slice(0, start) + emoji + content.slice(cursor);
      const newCursor = start + emoji.length;
      setContent(newContent);
      setCursorPos(newCursor);
      setSuggestions([]);
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [content]
  );

  const selectSuggestion = useCallback(
    (entry: EmojiResult) => {
      insertEmoji(entry.native, shortcodeStart);
    },
    [insertEmoji, shortcodeStart]
  );

  // ── Textarea change ──
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursor = e.target.selectionStart ?? value.length;

      const replaced = tryReplaceShortcodeAtCursor(value, cursor);
      if (replaced) {
        setContent(replaced.newText);
        setCursorPos(replaced.newCursor);
        setSuggestions([]);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(
              replaced.newCursor,
              replaced.newCursor
            );
          }
        });
        return;
      }

      setContent(value);
      setCursorPos(cursor);
    },
    []
  );

  // ── Textarea keyboard ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx((i) => (i + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx((i) =>
            (i - 1 + suggestions.length) % suggestions.length
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          selectSuggestion(suggestions[activeIdx]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSuggestions([]);
          return;
        }
      }

      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleCreateBuzz();
      }
    },
    [suggestions, activeIdx, selectSuggestion, handleCreateBuzz]
  );

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
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-xl px-3 border-b border-slate-700"
                  placeholder="Buzz about what's happening..."
                  rows={3}
                />
                {imageURL && (
                  <Image
                    src={imageURL}
                    alt="buzz-image"
                    width={300}
                    height={300}
                    className="mt-3 max-h-64 object-contain"
                  />
                )}
                <div className="mt-2 flex justify-between items-center relative">
                  <div className="flex items-center gap-3">
                    <BiImageAlt
                      onClick={handleSelectImage}
                      className="text-xl cursor-pointer"
                    />
                    <button
                      ref={emojiButtonRef}
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="text-xl leading-none"
                      aria-label="Emoji picker"
                    >
                      <BsEmojiSmile />
                    </button>
                  </div>

                  {/* Inline emoji suggestions */}
                  {suggestions.length > 0 && (
                    <div
                      className="absolute top-8 left-0 mt-1 w-64 max-h-56 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg z-50"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {suggestions.map((entry, i) => (
                        <button
                          key={entry.id}
                          className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
                            i === activeIdx
                              ? "bg-gray-700 text-white"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                          onClick={() => selectSuggestion(entry)}
                          onMouseEnter={() => setActiveIdx(i)}
                        >
                          <span className="text-lg leading-none">
                            {entry.native}
                          </span>
                          <span className="truncate text-gray-400">
                            :{entry.id}:
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emoji picker */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute top-8 left-0 z-50"
                    >
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => {
                          setShowEmojiPicker(false);
                          insertEmoji(emoji.native);
                        }}
                        theme="dark"
                        locale="en"
                        skinTonePosition="none"
                        previewPosition="none"
                        maxFrequentRows={1}
                        perLine={8}
                        navPosition="bottom"
                      />
                    </div>
                  )}

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
