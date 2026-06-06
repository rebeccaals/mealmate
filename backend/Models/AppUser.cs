using Microsoft.AspNetCore.Identity;

namespace Mealmate.Api.Models;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
}
