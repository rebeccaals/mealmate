namespace Mealmate.Api.DTOs;

public record OppskriftListDto(
    Guid Id,
    string Tittel,
    string? Beskrivelse,
    int Porsjoner,
    int? ForberedelsestidMinutter,
    int? TilberedningstidMinutter,
    List<KategoriDto> Kategorier);

public record OppskriftDetailDto(
    Guid Id,
    string Tittel,
    string? Beskrivelse,
    int Porsjoner,
    int? ForberedelsestidMinutter,
    int? TilberedningstidMinutter,
    List<string> Steg,
    List<IngrediensDto> Ingredienser,
    List<KategoriDto> Kategorier);

public record IngrediensDto(Guid Id, string Navn, decimal Mengde, string Enhet);

public record OppskriftRequest(
    string Tittel,
    string? Beskrivelse,
    int Porsjoner,
    int? ForberedelsestidMinutter,
    int? TilberedningstidMinutter,
    List<IngrediensRequestItem> Ingredienser,
    List<string> Steg,
    List<Guid> KategoriIder);

public record IngrediensRequestItem(string Navn, decimal Mengde, string Enhet);
