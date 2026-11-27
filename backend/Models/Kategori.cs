namespace Mealmate.Api.Models;

public class Kategori
{
    public Guid Id { get; set; }
    public string Navn { get; set; } = string.Empty;

    public List<Oppskrift> Oppskrifter { get; set; } = [];
}
