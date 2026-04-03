import React from "react";
import BuzzLayout from "@/components/FeedCard/Layout/BuzzLayout";
import { useCurrentUser } from "@/hooks/user";

export default function Notifications() {
  const { user } = useCurrentUser();

  return (
    <div>
      <BuzzLayout>
        <div className="p-5 border-b border-gray-600">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div>
          {user?.notifications?.length === 0 ? (
            <div className="p-5 text-gray-500">No new notifications</div>
          ) : (
            user?.notifications?.map((notification) => (
              <div
                key={notification?.id}
                className="p-5 border-b border-gray-600 hover:bg-slate-900 transition-all"
              >
                <div className="text-lg">{notification?.content}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {notification?.createdAt && new Date(Number(notification.createdAt)).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </BuzzLayout>
    </div>
  );
}
