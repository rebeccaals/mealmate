using Mealmate.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace Mealmate.Api.Data;

public static class DataSeeder
{
    public static async Task SeedUsersAsync(UserManager<AppUser> userManager)
    {
        await CreateUserIfNotExists(userManager, new AppUser
        {
            UserName = "rebecca_div@outlook.com",
            Email = "rebecca_div@outlook.com",
            DisplayName = "Rebecca",
            EmailConfirmed = true,
        }, password: "Mealmate1");

        await CreateUserIfNotExists(userManager, new AppUser
        {
            UserName = "nicolovli@gmail.com",
            Email = "nicolovli@gmail.com",
            DisplayName = "Nicolay",
            EmailConfirmed = true,
        }, password: "Mealmate1");
    }

    private static async Task CreateUserIfNotExists(
        UserManager<AppUser> userManager,
        AppUser user,
        string password)
    {
        var existing = await userManager.FindByEmailAsync(user.Email!);
        if (existing is null)
        {
            await userManager.CreateAsync(user, password);
        }
    }
}
