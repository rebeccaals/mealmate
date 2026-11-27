using Mealmate.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace Mealmate.Api.Data;

public static class DataSeeder
{
    // Passwords come from configuration: appsettings.Development.json locally,
    // and the env vars SeedPasswords__Rebecca / SeedPasswords__Nicolay in production.
    // They are only used when a user is created for the first time.
    public static async Task SeedUsersAsync(UserManager<AppUser> userManager, IConfiguration configuration)
    {
        await CreateUserIfNotExists(userManager, configuration, new AppUser
        {
            UserName = "rebecca_div@outlook.com",
            Email = "rebecca_div@outlook.com",
            DisplayName = "Rebecca",
            EmailConfirmed = true,
        });

        await CreateUserIfNotExists(userManager, configuration, new AppUser
        {
            UserName = "nicolovli@gmail.com",
            Email = "nicolovli@gmail.com",
            DisplayName = "Nicolay",
            EmailConfirmed = true,
        });
    }

    private static async Task CreateUserIfNotExists(
        UserManager<AppUser> userManager,
        IConfiguration configuration,
        AppUser user)
    {
        var existing = await userManager.FindByEmailAsync(user.Email!);
        if (existing is not null)
            return;

        var password = configuration[$"SeedPasswords:{user.DisplayName}"]
            ?? throw new InvalidOperationException(
                $"SeedPasswords:{user.DisplayName} is required to create the user {user.Email}.");

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new InvalidOperationException(
                $"Could not create {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
    }
}
