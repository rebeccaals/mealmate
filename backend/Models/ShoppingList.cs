namespace Mealmate.Api.Models;

public class ShoppingList
{
    public Guid Id { get; set; }
    public Guid WeeklyMenuId { get; set; }
    public WeeklyMenu WeeklyMenu { get; set; } = null!;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public List<ShoppingItem> Items { get; set; } = [];
}

public class ShoppingItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsChecked { get; set; }

    public string? CheckedById { get; set; }
    public AppUser? CheckedBy { get; set; }
    public DateTime? CheckedAt { get; set; }

    public Guid ShoppingListId { get; set; }
    public ShoppingList ShoppingList { get; set; } = null!;
}
