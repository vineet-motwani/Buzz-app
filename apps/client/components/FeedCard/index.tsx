import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BiMessageRounded, BiUpload } from 'react-icons/bi';
import { FaRetweet } from 'react-icons/fa';
import { AiOutlineHeart } from 'react-icons/ai';
import { Tweet } from '@/gql/graphql';

interface FeedCardProps {
    data: Tweet;
}

const FeedCard:React.FC<FeedCardProps> = (props) => {
    const { data } = props;
    return <div className="border border-r-0 border-l-0 border-b-0 border-gray-600 p-5 hover:bg-slate-800 transition-all cursor-pointer">
        <div className="grid grid-cols-12 gap-3">
            <div className="col-span-1">
                {data.author?.profileImageURL && (
                    <Link href={`/${data.author.id}`}> 
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
                <h5>{data.author?.firstName} {data.author?.lastName}</h5>
                <p>
                    {data.content}
                </p>
                {data.imageURL && (
                    <Image
                        src={data.imageURL}
                        alt="Buzz image"
                        width={500}
                        height={500}
                        className="mt-3 w-full rounded-xl"
                    />
                )}
                <div className="flex justify-between mt-3 text-xl items-center w-[80%]">
                    <div>
                        <BiMessageRounded/>
                    </div>
                    <div>
                        <FaRetweet/>
                    </div>
                    <div>
                        <AiOutlineHeart/>
                    </div>
                    <div>
                        <BiUpload/>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default FeedCard;