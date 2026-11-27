import type { UkesmenyResponse, MåltidResponse, AddMåltidRequest } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const ukesmenyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUkesmeny: builder.query<UkesmenyResponse, string>({
      query: (ukestart) => `ukesmeny?ukestart=${ukestart}`,
      providesTags: ['Ukesmeny'],
    }),
    addMåltid: builder.mutation<MåltidResponse, { ukestart: string; body: AddMåltidRequest }>({
      query: ({ ukestart, body }) => ({
        url: `ukesmeny/${ukestart}/maltider`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Ukesmeny'],
    }),
    removeMåltid: builder.mutation<void, { ukestart: string; måltidId: string }>({
      query: ({ ukestart, måltidId }) => ({
        url: `ukesmeny/${ukestart}/maltider/${måltidId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ukesmeny'],
    }),
  }),
})

export const { useGetUkesmenyQuery, useAddMåltidMutation, useRemoveMåltidMutation } = ukesmenyApi
