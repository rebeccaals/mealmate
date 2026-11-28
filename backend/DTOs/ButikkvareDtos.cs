using Mealmate.Api.Models;

namespace Mealmate.Api.DTOs;

public record ButikkvareDto(Guid Id, string Navn, Avdeling Avdeling, int AntallOppskrifter);

// Creates every name that doesn't exist yet; existing ones (ignoring case) are left untouched
public record CreateButikkvarerRequest(List<string> Navn, Avdeling Avdeling);

public record UpdateButikkvareRequest(string Navn, Avdeling Avdeling);

public record SlåSammenRequest(Guid MålId);
