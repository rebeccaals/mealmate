import type { Butikkvare, CreateButikkvarerRequest, UpdateButikkvareRequest } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const butikkvarerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getButikkvarer: builder.query<Butikkvare[], void>({
      query: () => 'butikkvarer',
      providesTags: ['Butikkvare'],
    }),
    createButikkvarer: builder.mutation<Butikkvare[], CreateButikkvarerRequest>({
      query: (body) => ({ url: 'butikkvarer', method: 'POST', body }),
      invalidatesTags: ['Butikkvare'],
    }),
    updateButikkvare: builder.mutation<Butikkvare, { id: string; body: UpdateButikkvareRequest }>({
      query: ({ id, body }) => ({ url: `butikkvarer/${id}`, method: 'PUT', body }),
      // Names show up inside oppskrifter too
      invalidatesTags: ['Butikkvare', 'Oppskrift'],
    }),
    deleteButikkvare: builder.mutation<void, string>({
      query: (id) => ({ url: `butikkvarer/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Butikkvare'],
    }),
    slåSammenButikkvarer: builder.mutation<void, { id: string; målId: string }>({
      query: ({ id, målId }) => ({ url: `butikkvarer/${id}/sla-sammen`, method: 'POST', body: { målId } }),
      invalidatesTags: ['Butikkvare', 'Oppskrift'],
    }),
  }),
})

export const {
  useGetButikkvarerQuery,
  useCreateButikkvarerMutation,
  useUpdateButikkvareMutation,
  useDeleteButikkvareMutation,
  useSlåSammenButikkvarerMutation,
} = butikkvarerApi
