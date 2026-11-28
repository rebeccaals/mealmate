using System.Text.RegularExpressions;

namespace Mealmate.Api.Services;

// The same name rules as packages/schemas/src/ingrediens.ts (normaliserNavn / storForbokstav)
public static partial class ButikkvareNavn
{
    [GeneratedRegex(@"\s+")]
    private static partial Regex Mellomrom();

    // "  smør  usaltet " → "Smør usaltet" — how butikkvarer are stored
    public static string Pent(string navn)
    {
        var t = Mellomrom().Replace(navn.Trim(), " ");
        return t.Length == 0 ? t : char.ToUpperInvariant(t[0]) + t[1..];
    }

    // "  Smør  usaltet " → "smør usaltet" — what two names are compared by
    public static string Normalisert(string navn) => Pent(navn).ToLowerInvariant();
}
