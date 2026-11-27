namespace Mealmate.Api.DTOs;

public record KategoriDto(Guid Id, string Navn);

public record KategoriRequest(string Navn);
