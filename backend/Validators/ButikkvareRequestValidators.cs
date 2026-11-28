using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class CreateButikkvarerRequestValidator : AbstractValidator<CreateButikkvarerRequest>
{
    public CreateButikkvarerRequestValidator()
    {
        RuleFor(x => x.Navn).NotEmpty().WithMessage("Skriv inn minst én vare.");
        RuleForEach(x => x.Navn).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Avdeling).IsInEnum();
    }
}

public class UpdateButikkvareRequestValidator : AbstractValidator<UpdateButikkvareRequest>
{
    public UpdateButikkvareRequestValidator()
    {
        RuleFor(x => x.Navn).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Avdeling).IsInEnum();
    }
}
