using Mealmate.Api.Models;

namespace Mealmate.Api.DTOs;

public record WeeklyMenuDto(string WeekStart, List<MenuEntryDto> Entries);

public record MenuEntryDto(
    Guid Id,
    DayOfWeek Day,
    MealType MealType,
    Guid RecipeId,
    string RecipeTitle);

public record AddMenuEntryRequest(DayOfWeek Day, MealType MealType, Guid RecipeId);
