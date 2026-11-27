using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class KategoriRequestValidator : AbstractValidator<KategoriRequest>
{
    public KategoriRequestValidator()
    {
        RuleFor(x => x.Navn).NotEmpty().MaximumLength(100);
    }
}
