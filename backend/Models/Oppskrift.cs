namespace Mealmate.Api.Models;

public class Oppskrift
{
    public Guid Id { get; set; }
    public string Tittel { get; set; } = string.Empty;
    public string? Beskrivelse { get; set; }
    public int Porsjoner { get; set; }
    public int? ForberedelsestidMinutter { get; set; }
    public int? TilberedningstidMinutter { get; set; }
    public List<string> Steg { get; set; } = [];
    public DateTime Opprettet { get; set; } = DateTime.UtcNow;

    public string OpprettetAvId { get; set; } = string.Empty;
    public AppUser OpprettetAv { get; set; } = null!;

    public List<Ingrediens> Ingredienser { get; set; } = [];
    public List<Kategori> Kategorier { get; set; } = [];
}
