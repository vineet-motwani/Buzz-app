import { graphqlClient } from "@/clients/api";
import { CreateBuzzData } from "@/gql/graphql";
import { createBuzzMutation } from "@/graphql/mutations/buzz";
import { getAllBuzzsQuery } from "@/graphql/query/buzz";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast";

export const useCreateBuzz = () => {
    const queryClient = useQueryClient(); 
    
    const mutation = useMutation({
        mutationFn: (payload: CreateBuzzData) => graphqlClient.request(createBuzzMutation, { payload }),
        onMutate: ( payload ) => toast.loading("Buzzing...", { id: '1' }),
        onSuccess: async ( payload ) =>  { 
            await queryClient.invalidateQueries({ queryKey: ["all-buzzs"] });
            toast.success("Buzzed!", { id: '1' })
        },
    });
    
    return mutation;
}
export const useGetAllBuzzs = () => {
    const query = useQuery({
        queryKey: ["all-buzzs"],
        queryFn: () => graphqlClient.request(getAllBuzzsQuery)
    })
    return {...query, buzzs: query.data?.getAllBuzzs}
}