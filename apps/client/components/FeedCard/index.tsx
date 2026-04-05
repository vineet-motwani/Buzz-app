import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { Buzz } from '@/gql/graphql';
import { graphqlClient } from '@/clients/api';
import { graphql } from '@/gql';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface FeedCardProps {
    data: Buzz;
}

const likeBuzzMutation = graphql(`
  mutation LikeBuzz($buzzId: String!) {
    likeBuzz(buzzId: $buzzId)
  }
`);

const bookmarkBuzzMutation = graphql(`
  mutation BookmarkBuzz($buzzId: String!) {
    bookmarkBuzz(buzzId: $buzzId)
  }
`);

const FeedCard:React.FC<FeedCardProps> = (props) => {
    const { data } = props;
    const queryClient = useQueryClient();

    const handleLike = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { likeBuzz } = await graphqlClient.request(likeBuzzMutation, { buzzId: data.id });
            if (likeBuzz) {
                toast.success("Liked buzz!");
            } else {
                toast.success("Unliked buzz!");
            }
            queryClient.invalidateQueries({ queryKey: ["all-buzzs"] });
            queryClient.invalidateQueries({ queryKey: ["current-user"] });
        } catch (err) {
            toast.error("Failed to update like");
        }
    }, [data.id, queryClient]);

    const handleBookmark = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { bookmarkBuzz } = await graphqlClient.request(bookmarkBuzzMutation, { buzzId: data.id });
            if (bookmarkBuzz) {
                toast.success("Added to bookmarks!");
            } else {
                toast.success("Removed from bookmarks!");
            }
            queryClient.invalidateQueries({ queryKey: ["all-buzzs"] });
            queryClient.invalidateQueries({ queryKey: ["current-user"] });
        } catch (err) {
            toast.error("Failed to update bookmark");
        }
    }, [data.id, queryClient]);

    return <div className="border border-r-0 border-l-0 border-b-0 border-gray-600 p-5 hover:bg-slate-800 transition-all cursor-pointer">
        <div className="grid grid-cols-12 gap-3">
            <div className="col-span-1">
                {data.author?.profileImageURL && (
                    <Link href={`/${data.author.username}`}>
                        <Image 
                            src={data.author?.profileImageURL} 
                            height={50} 
                            width={50} 
                            alt='user profile image' 
                            className="rounded-full"
                        />
                    </Link>
                )}
            </div>
            <div className="col-span-11">
                <h5>
                    <Link href={`/${data.author?.username}`}>
                        <span className="font-semibold cursor-pointer hover:underline">{data.author?.firstName} {data.author?.lastName}</span>
                    </Link>
                </h5>
                <p>
                    {data.content}
                </p>
                {data.imageURL && (
                    <Image
                        src={data.imageURL}
                        alt="Buzz image"
                        width={500}
                        height={500}
                        className="mt-3 w-full rounded-xl max-h-96 object-contain"
                    />
                )}
                <div className="flex justify-between mt-3 text-xl items-center w-[80%]">
                    <div onClick={handleLike} className={`p-2 rounded-full cursor-pointer transition-all hover:bg-pink-900/20 ${data.hasLiked ? 'text-red-500' : 'hover:text-pink-500'}`}>
                        {data.hasLiked ? <AiFillHeart/> : <AiOutlineHeart/>}
                    </div>
                    <div onClick={handleBookmark} className={`p-2 rounded-full cursor-pointer transition-all hover:bg-blue-900/20 ${data.hasBookmarked ? 'text-[#1d9bf0]' : 'hover:text-blue-500'}`}>
                        {data.hasBookmarked ? <BsBookmarkFill/> : <BsBookmark/>}
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default FeedCard;