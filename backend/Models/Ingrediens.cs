namespace Mealmate.Api.Models;

public class Ingrediens
{
    public Guid Id { get; set; }
    public string Navn { get; set; } = string.Empty;
    public decimal Mengde { get; set; }
    public string Enhet { get; set; } = string.Empty;

    public Guid OppskriftId { get; set; }
    public Oppskrift Oppskrift { get; set; } = null!;
}
