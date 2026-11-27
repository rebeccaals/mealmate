using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class SaveMåltidRequestValidator : AbstractValidator<SaveMåltidRequest>
{
    public SaveMåltidRequestValidator()
    {
        RuleFor(x => x.Porsjoner).InclusiveBetween(1, 50);
        RuleFor(x => x.Notat).MaximumLength(200);
        RuleFor(x => x.OppskriftIder).NotNull();
    }
}
