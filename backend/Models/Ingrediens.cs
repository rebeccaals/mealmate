using System.Text.Json.Serialization;

namespace Mealmate.Api.Models;

// A butikkvare with an amount and an enhet, as part of an oppskrift, e.g. "2 ss smør, myk".
public class Ingrediens
{
    public Guid Id { get; set; }

    // Position in the oppskrift's list, so ingredienser keep the order they were written in
    public int Rekkefølge { get; set; }

    public Guid ButikkvareId { get; set; }
    public Butikkvare Butikkvare { get; set; } = null!;

    // Both null for e.g. "salt og pepper"; otherwise both set
    public decimal? Mengde { get; set; }
    public Enhet? Enhet { get; set; }

    // Free text after the first comma, e.g. "finhakket"
    public string? Merknad { get; set; }

    public Guid OppskriftId { get; set; }
    public Oppskrift Oppskrift { get; set; } = null!;
}

// Fixed set of enheter. Sent as lowercase text in JSON ("ss"), stored by name in the database ("Ss").
public enum Enhet
{
    [JsonStringEnumMemberName("g")] G,
    [JsonStringEnumMemberName("kg")] Kg,
    [JsonStringEnumMemberName("ml")] Ml,
    [JsonStringEnumMemberName("dl")] Dl,
    [JsonStringEnumMemberName("l")] L,
    [JsonStringEnumMemberName("ts")] Ts,
    [JsonStringEnumMemberName("ss")] Ss,
    [JsonStringEnumMemberName("stk")] Stk,
    [JsonStringEnumMemberName("fedd")] Fedd,
    [JsonStringEnumMemberName("pakke")] Pakke,
    [JsonStringEnumMemberName("boks")] Boks,
    [JsonStringEnumMemberName("klype")] Klype,
}
