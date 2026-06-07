using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class AddMenuEntryRequestValidator : AbstractValidator<AddMenuEntryRequest>
{
    public AddMenuEntryRequestValidator()
    {
        RuleFor(x => x.RecipeId).NotEmpty();
    }
}
