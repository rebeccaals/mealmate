namespace Mealmate.Api.Models;

public class Ukesmeny
{
    public Guid Id { get; set; }
    public DateOnly Ukestart { get; set; }

    public List<Måltid> Måltider { get; set; } = [];
}

public class Måltid
{
    public Guid Id { get; set; }
    public DayOfWeek Dag { get; set; }
    public Måltidstype Måltidstype { get; set; }

    public Guid UkesmenyId { get; set; }
    public Ukesmeny Ukesmeny { get; set; } = null!;

    public Guid OppskriftId { get; set; }
    public Oppskrift Oppskrift { get; set; } = null!;
}

public enum Måltidstype
{
    Frokost,
    Lunsj,
    Middag,
}
