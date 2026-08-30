import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const vehicleQueryKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...vehicleQueryKeys.all, 'detail', id] as const,
}
