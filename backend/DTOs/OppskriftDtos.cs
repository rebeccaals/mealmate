using Mealmate.Api.Models;

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

// Navn and Avdeling come from the butikkvare
public record IngrediensDto(
    Guid Id,
    Guid ButikkvareId,
    string Navn,
    Avdeling Avdeling,
    decimal? Mengde,
    Enhet? Enhet,
    string? Merknad);

public record OppskriftRequest(
    string Tittel,
    string? Beskrivelse,
    int Porsjoner,
    int? ForberedelsestidMinutter,
    int? TilberedningstidMinutter,
    List<IngrediensRequestItem> Ingredienser,
    List<string> Steg,
    List<Guid> KategoriIder);

// The butikkvare is given by name: an existing one is reused (ignoring case), otherwise it's
// created with the given Avdeling (or Annet). Ingredienser are stored in the order they're sent.
public record IngrediensRequestItem(
    string ButikkvareNavn,
    Avdeling? Avdeling,
    decimal? Mengde,
    Enhet? Enhet,
    string? Merknad);
