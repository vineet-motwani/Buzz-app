import { graphqlClient } from "@/clients/api";
import { followUserMutation, unfollowUserMutation } from "@/graphql/mutations/user";
import { getCurrentUserQuery, getUserByIdQuery, getUserByNameQuery } from "@/graphql/query/user";
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

export const useGetUserByName = (name: string) => {
    const query = useQuery({
        queryKey: ['user', name],
        queryFn: () => graphqlClient.request(getUserByNameQuery, { name }),
        enabled: !!name,
    });

    return { ...query, user: query.data?.getUserByName };
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