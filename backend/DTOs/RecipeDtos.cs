namespace Mealmate.Api.DTOs;

public record RecipeListDto(
    Guid Id,
    string Title,
    string? Description,
    int Servings,
    int? PrepTimeMinutes,
    int? CookTimeMinutes,
    List<CategoryDto> Categories);

public record RecipeDetailDto(
    Guid Id,
    string Title,
    string? Description,
    int Servings,
    int? PrepTimeMinutes,
    int? CookTimeMinutes,
    List<string> Steps,
    List<IngredientDto> Ingredients,
    List<CategoryDto> Categories);

public record IngredientDto(Guid Id, string Name, decimal Amount, string Unit);

public record RecipeRequest(
    string Title,
    string? Description,
    int Servings,
    int? PrepTimeMinutes,
    int? CookTimeMinutes,
    List<IngredientRequestItem> Ingredients,
    List<string> Steps,
    List<Guid> CategoryIds);

public record IngredientRequestItem(string Name, decimal Amount, string Unit);
