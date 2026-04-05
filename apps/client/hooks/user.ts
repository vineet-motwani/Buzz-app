import { graphqlClient } from "@/clients/api";
import { followUserMutation, unfollowUserMutation, updateUserProfileMutation } from "@/graphql/mutations/user";
import { getCurrentUserQuery, getUserByIdQuery, getUserByUsernameQuery } from "@/graphql/query/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useCurrentUser = () => {
    const query = useQuery({
        queryKey: ['current-user'],
        queryFn: () => graphqlClient.request(getCurrentUserQuery),
    });

    return {...query, user: query.data?.getCurrentUser};
}

export const useGetUserById = (id: string) => {
    const query = useQuery({
        queryKey: ['user', id],
        queryFn: () => graphqlClient.request(getUserByIdQuery, { id }),
        enabled: !!id,
    });

    return { ...query, user: query.data?.getUserById };
}

export const useGetUserByUsername = (username: string) => {
    const query = useQuery({
        queryKey: ['user', username],
        queryFn: () => graphqlClient.request(getUserByUsernameQuery, { username }),
        enabled: !!username,
    });

    return { ...query, user: query.data?.getUserByUsername };
}

export const useFollowUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (to: string) => graphqlClient.request(followUserMutation, { to }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success("Followed!");
        },
    });
    return mutation;
}

export const useUnfollowUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (to: string) => graphqlClient.request(unfollowUserMutation, { to }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success("Unfollowed!");
        },
    });
    return mutation;
}

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { firstName?: string; lastName?: string; profileImageURL?: string }) =>
            graphqlClient.request(updateUserProfileMutation, { payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success("Profile updated!");
        },
    });
}
