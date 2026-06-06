namespace Mealmate.Api.Models;

public class Recipe
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Servings { get; set; }
    public int? PrepTimeMinutes { get; set; }
    public int? CookTimeMinutes { get; set; }
    public List<string> Steps { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string CreatedById { get; set; } = string.Empty;
    public AppUser CreatedBy { get; set; } = null!;

    public List<Ingredient> Ingredients { get; set; } = [];
    public List<Category> Categories { get; set; } = [];
}
