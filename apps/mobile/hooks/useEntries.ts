import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useEntries() {
  return useInfiniteQuery({
    queryKey: ['entries'],
    queryFn: ({ pageParam = 1 }) => api.entries.list(pageParam as number, 20),
    getNextPageParam: (last) => (last.entries.length === 20 ? last.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.entries.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entries'] }),
  });
}
