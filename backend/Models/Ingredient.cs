namespace Mealmate.Api.Models;

public class Ingredient
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;

    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
}
