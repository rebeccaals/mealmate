import type { WeeklyMenuResponse, MenuEntryResponse, DayOfWeek, MealType } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

interface AddMenuEntryRequest {
  day: DayOfWeek
  mealType: MealType
  recipeId: string
}

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<WeeklyMenuResponse, string>({
      query: (weekStart) => `menu?weekStart=${weekStart}`,
      providesTags: ['Menu'],
    }),
    addMenuEntry: builder.mutation<MenuEntryResponse, { weekStart: string; body: AddMenuEntryRequest }>({
      query: ({ weekStart, body }) => ({
        url: `menu/${weekStart}/entries`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Menu'],
    }),
    removeMenuEntry: builder.mutation<void, { weekStart: string; entryId: string }>({
      query: ({ weekStart, entryId }) => ({
        url: `menu/${weekStart}/entries/${entryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),
  }),
})

export const { useGetMenuQuery, useAddMenuEntryMutation, useRemoveMenuEntryMutation } = menuApi
