using Mealmate.Api.Models;

namespace Mealmate.Api.DTOs;

public record UkesmenyDto(string Ukestart, List<MåltidDto> Måltider);

public record MåltidDto(
    Guid Id,
    DayOfWeek Dag,
    Måltidstype Måltidstype,
    Guid OppskriftId,
    string OppskriftTittel);

public record AddMåltidRequest(DayOfWeek Dag, Måltidstype Måltidstype, Guid OppskriftId);
