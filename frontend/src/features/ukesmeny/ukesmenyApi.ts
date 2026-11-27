import type { UkesmenyResponse, MåltidResponse, SaveMåltidRequest, DayOfWeek, Måltidstype } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const ukesmenyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUkesmeny: builder.query<UkesmenyResponse, string>({
      query: (ukestart) => `ukesmeny?ukestart=${ukestart}`,
      providesTags: ['Ukesmeny'],
    }),
    // Returns the saved måltid, or nothing (204) if it became empty and was removed
    saveMåltid: builder.mutation<
      MåltidResponse | null,
      { ukestart: string; dag: DayOfWeek; måltidstype: Måltidstype; body: SaveMåltidRequest }
    >({
      query: ({ ukestart, dag, måltidstype, body }) => ({
        url: `ukesmeny/${ukestart}/maltider/${dag}/${måltidstype}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Ukesmeny'],
    }),
  }),
})

export const { useGetUkesmenyQuery, useSaveMåltidMutation } = ukesmenyApi
