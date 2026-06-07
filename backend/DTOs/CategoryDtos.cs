namespace Mealmate.Api.DTOs;

public record CategoryDto(Guid Id, string Name);

public record CategoryRequest(string Name);
