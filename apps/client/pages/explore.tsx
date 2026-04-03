import React, { useEffect, useState } from "react";
import FeedCard from "@/components/FeedCard";
import { useGetAllBuzzs } from "@/hooks/buzz";
import { Buzz } from "@/gql/graphql";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";

export default function Explore() {
  const { buzzs = [] } = useGetAllBuzzs();
  const [randomBuzzs, setRandomBuzzs] = useState<Buzz[]>([]);

  useEffect(() => {
    if (buzzs) {
      setRandomBuzzs([...buzzs].sort(() => Math.random() - 0.5) as Buzz[]);
    }
  }, [buzzs]);

  return (
    <div>
      <BuzzLayout>
        <div className="p-5 border-b border-gray-600">
          <h1 className="text-2xl font-bold">Explore</h1>
        </div>
        {randomBuzzs?.map((buzz) =>
          buzz ? <FeedCard key={buzz.id} data={buzz} /> : null
        )}
      </BuzzLayout>
    </div>
  );
}