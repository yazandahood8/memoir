import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCollections() {
  return useQuery({ queryKey: ['collections'], queryFn: api.collections.list });
}

export function useCloseCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.collections.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
