using FluentValidation;
using Mealmate.Api.DTOs;

namespace Mealmate.Api.Validators;

public class OppskriftRequestValidator : AbstractValidator<OppskriftRequest>
{
    public OppskriftRequestValidator()
    {
        RuleFor(x => x.Tittel).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Porsjoner).GreaterThan(0);
        RuleFor(x => x.Ingredienser).NotEmpty().WithMessage("Oppskriften må ha minst én ingrediens.");
        RuleForEach(x => x.Ingredienser).ChildRules(i =>
        {
            i.RuleFor(x => x.Navn).NotEmpty();
            i.RuleFor(x => x.Mengde).GreaterThan(0);
            i.RuleFor(x => x.Enhet).NotEmpty();
        });
        RuleFor(x => x.Steg).NotEmpty().WithMessage("Oppskriften må ha minst ett steg.");
        RuleForEach(x => x.Steg).NotEmpty();
    }
}
