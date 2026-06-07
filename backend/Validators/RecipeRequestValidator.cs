using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class RecipeRequestValidator : AbstractValidator<RecipeRequest>
{
    public RecipeRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Servings).GreaterThan(0);
        RuleFor(x => x.Ingredients).NotEmpty().WithMessage("At least one ingredient is required.");
        RuleForEach(x => x.Ingredients).ChildRules(i =>
        {
            i.RuleFor(x => x.Name).NotEmpty();
            i.RuleFor(x => x.Amount).GreaterThan(0);
            i.RuleFor(x => x.Unit).NotEmpty();
        });
        RuleFor(x => x.Steps).NotEmpty().WithMessage("At least one step is required.");
        RuleForEach(x => x.Steps).NotEmpty();
    }
}
