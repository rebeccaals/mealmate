namespace Mealmate.Api.Models;

// Something the household buys, without an amount, e.g. "Smør" or "Dopapir".
// Shared by oppskrifter (via Ingrediens) and, later, the handleliste.
public class Butikkvare
{
    public Guid Id { get; set; }
    public string Navn { get; set; } = string.Empty;
    public Avdeling Avdeling { get; set; } = Avdeling.Annet;

    public List<Ingrediens> Ingredienser { get; set; } = [];
}

// Where in the store a butikkvare is found. Stored as text in the database.
public enum Avdeling
{
    FruktOgGrønt,
    Brød,
    KjøttOgFisk,
    Meieri,
    Tørrvarer,
    Frys,
    Drikke,
    Husholdning,
    Annet,
}
