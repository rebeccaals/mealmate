namespace Mealmate.Api.Models;

public class WeeklyMenu
{
    public Guid Id { get; set; }
    public DateOnly WeekStart { get; set; }

    public List<MenuEntry> Entries { get; set; } = [];
}

public class MenuEntry
{
    public Guid Id { get; set; }
    public DayOfWeek Day { get; set; }
    public MealType MealType { get; set; }

    public Guid WeeklyMenuId { get; set; }
    public WeeklyMenu WeeklyMenu { get; set; } = null!;

    public Guid RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
}

public enum MealType
{
    Breakfast,
    Lunch,
    Dinner,
}
