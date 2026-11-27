using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class AddMåltidRequestValidator : AbstractValidator<AddMåltidRequest>
{
    public AddMåltidRequestValidator()
    {
        RuleFor(x => x.OppskriftId).NotEmpty();
    }
}
