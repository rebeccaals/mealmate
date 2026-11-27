using Mealmate.Api.Models;

namespace Mealmate.Api.DTOs;

public record UkesmenyDto(string Ukestart, List<MåltidDto> Måltider);

public record MåltidDto(
    Guid Id,
    DayOfWeek Dag,
    Måltidstype Måltidstype,
    int Porsjoner,
    string? Notat,
    List<MåltidOppskriftDto> Oppskrifter);

public record MåltidOppskriftDto(Guid Id, string Tittel);

// Replaces the whole måltid (upsert). Empty oppskrifter + empty notat removes the måltid.
public record SaveMåltidRequest(int Porsjoner, string? Notat, List<Guid> OppskriftIder);
