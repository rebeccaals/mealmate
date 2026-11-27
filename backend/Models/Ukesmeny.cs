namespace Mealmate.Api.Models;

public class Ukesmeny
{
    public Guid Id { get; set; }
    public DateOnly Ukestart { get; set; }

    public List<Måltid> Måltider { get; set; } = [];
}

public class Måltid
{
    public const int StandardPorsjoner = 2;

    public Guid Id { get; set; }
    public DayOfWeek Dag { get; set; }
    public Måltidstype Måltidstype { get; set; }
    public int Porsjoner { get; set; } = StandardPorsjoner;
    public string? Notat { get; set; }

    public Guid UkesmenyId { get; set; }
    public Ukesmeny Ukesmeny { get; set; } = null!;

    // Many-to-many: all oppskrifter in a måltid are scaled to its Porsjoner
    public List<Oppskrift> Oppskrifter { get; set; } = [];
}

public enum Måltidstype
{
    Frokost,
    Lunsj,
    Middag,
    Kvelds,
}
