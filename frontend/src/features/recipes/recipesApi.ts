import type { Recipe, RecipeListItem, RecipeDetail } from '@mealmate/schemas'
import { baseApi } from '@/features/api/baseApi'

export const recipesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecipes: builder.query<RecipeListItem[], void>({
      query: () => 'recipes',
      providesTags: ['Recipe'],
    }),
    getRecipe: builder.query<RecipeDetail, string>({
      query: (id) => `recipes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Recipe', id }],
    }),
    createRecipe: builder.mutation<RecipeDetail, Omit<Recipe, 'id'>>({
      query: (body) => ({ url: 'recipes', method: 'POST', body }),
      invalidatesTags: ['Recipe'],
    }),
    updateRecipe: builder.mutation<RecipeDetail, { id: string; body: Omit<Recipe, 'id'> }>({
      query: ({ id, body }) => ({ url: `recipes/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => ['Recipe', { type: 'Recipe', id }],
    }),
    deleteRecipe: builder.mutation<void, string>({
      query: (id) => ({ url: `recipes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Recipe'],
    }),
  }),
})

export const {
  useGetRecipesQuery,
  useGetRecipeQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipesApi
