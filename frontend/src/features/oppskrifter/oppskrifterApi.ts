import type { Oppskrift, OppskriftListItem, OppskriftDetail } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const oppskrifterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOppskrifter: builder.query<OppskriftListItem[], void>({
      query: () => 'oppskrifter',
      providesTags: ['Oppskrift'],
    }),
    getOppskrift: builder.query<OppskriftDetail, string>({
      query: (id) => `oppskrifter/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Oppskrift', id }],
    }),
    createOppskrift: builder.mutation<OppskriftDetail, Omit<Oppskrift, 'id'>>({
      query: (body) => ({ url: 'oppskrifter', method: 'POST', body }),
      invalidatesTags: ['Oppskrift'],
    }),
    updateOppskrift: builder.mutation<OppskriftDetail, { id: string; body: Omit<Oppskrift, 'id'> }>({
      query: ({ id, body }) => ({ url: `oppskrifter/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => ['Oppskrift', { type: 'Oppskrift', id }],
    }),
    deleteOppskrift: builder.mutation<void, string>({
      query: (id) => ({ url: `oppskrifter/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Oppskrift'],
    }),
  }),
})

export const {
  useGetOppskrifterQuery,
  useGetOppskriftQuery,
  useCreateOppskriftMutation,
  useUpdateOppskriftMutation,
  useDeleteOppskriftMutation,
} = oppskrifterApi
