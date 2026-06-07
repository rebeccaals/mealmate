using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/menu")]
[Authorize]
public class MenuController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string weekStart)
    {
        if (!DateOnly.TryParse(weekStart, out var date) || date.DayOfWeek != DayOfWeek.Monday)
            return BadRequest("weekStart must be a Monday date in YYYY-MM-DD format.");

        var menu = await db.WeeklyMenus
            .Include(m => m.Entries)
            .ThenInclude(e => e.Recipe)
            .FirstOrDefaultAsync(m => m.WeekStart == date);

        if (menu is null)
            return Ok(new WeeklyMenuDto(weekStart, []));

        var entries = menu.Entries
            .Select(e => new MenuEntryDto(e.Id, e.Day, e.MealType, e.RecipeId, e.Recipe.Title))
            .ToList();

        return Ok(new WeeklyMenuDto(weekStart, entries));
    }

    [HttpPost("{weekStart}/entries")]
    public async Task<IActionResult> AddEntry(string weekStart, [FromBody] AddMenuEntryRequest request)
    {
        if (!DateOnly.TryParse(weekStart, out var date) || date.DayOfWeek != DayOfWeek.Monday)
            return BadRequest("weekStart must be a Monday date in YYYY-MM-DD format.");

        var recipe = await db.Recipes.FindAsync(request.RecipeId);
        if (recipe is null)
            return NotFound("Recipe not found.");

        var menu = await db.WeeklyMenus
            .Include(m => m.Entries)
            .FirstOrDefaultAsync(m => m.WeekStart == date);

        if (menu is null)
        {
            menu = new WeeklyMenu { WeekStart = date };
            db.WeeklyMenus.Add(menu);
        }

        // Replace existing entry in the same slot
        var existing = menu.Entries.FirstOrDefault(e => e.Day == request.Day && e.MealType == request.MealType);
        if (existing is not null)
            db.MenuEntries.Remove(existing);

        var entry = new MenuEntry
        {
            Day = request.Day,
            MealType = request.MealType,
            RecipeId = request.RecipeId,
            WeeklyMenu = menu,
        };
        db.MenuEntries.Add(entry);
        await db.SaveChangesAsync();

        return Ok(new MenuEntryDto(entry.Id, entry.Day, entry.MealType, recipe.Id, recipe.Title));
    }

    [HttpDelete("{weekStart}/entries/{entryId:guid}")]
    public async Task<IActionResult> RemoveEntry(string weekStart, Guid entryId)
    {
        if (!DateOnly.TryParse(weekStart, out var date) || date.DayOfWeek != DayOfWeek.Monday)
            return BadRequest("weekStart must be a Monday date in YYYY-MM-DD format.");

        var entry = await db.MenuEntries
            .Include(e => e.WeeklyMenu)
            .FirstOrDefaultAsync(e => e.Id == entryId && e.WeeklyMenu.WeekStart == date);

        if (entry is null)
            return NotFound();

        db.MenuEntries.Remove(entry);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
