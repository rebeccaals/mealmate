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
            i.RuleFor(x => x.ButikkvareNavn).NotEmpty().MaximumLength(100);
            i.RuleFor(x => x.Mengde).GreaterThan(0).When(x => x.Mengde is not null);
            i.RuleFor(x => x.Merknad).MaximumLength(200);
            i.RuleFor(x => x)
                .Must(x => (x.Mengde is null) == (x.Enhet is null))
                .WithMessage("Mengde og enhet må enten begge være satt eller begge mangle.");
        });
        RuleFor(x => x.Steg).NotEmpty().WithMessage("Oppskriften må ha minst ett steg.");
        RuleForEach(x => x.Steg).NotEmpty();
    }
}
