import type { Kategori, KategoriRequest } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const kategorierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKategorier: builder.query<Kategori[], void>({
      query: () => 'kategorier',
      providesTags: ['Kategori'],
    }),
    createKategori: builder.mutation<Kategori, KategoriRequest>({
      query: (body) => ({ url: 'kategorier', method: 'POST', body }),
      invalidatesTags: ['Kategori'],
    }),
    updateKategori: builder.mutation<Kategori, { id: string; body: KategoriRequest }>({
      query: ({ id, body }) => ({ url: `kategorier/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Kategori'],
    }),
    deleteKategori: builder.mutation<void, string>({
      query: (id) => ({ url: `kategorier/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Kategori'],
    }),
  }),
})

export const {
  useGetKategorierQuery,
  useCreateKategoriMutation,
  useUpdateKategoriMutation,
  useDeleteKategoriMutation,
} = kategorierApi
