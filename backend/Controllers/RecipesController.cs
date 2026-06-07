using System.Security.Claims;
using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/recipes")]
[Authorize]
public class RecipesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var recipes = await db.Recipes
            .Include(r => r.Categories)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecipeListDto(
                r.Id,
                r.Title,
                r.Description,
                r.Servings,
                r.PrepTimeMinutes,
                r.CookTimeMinutes,
                r.Categories.Select(c => new CategoryDto(c.Id, c.Name)).ToList()))
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var recipe = await db.Recipes
            .Include(r => r.Ingredients)
            .Include(r => r.Categories)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recipe is null)
            return NotFound();

        return Ok(ToDetailDto(recipe));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RecipeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var categories = await db.Categories
            .Where(c => request.CategoryIds.Contains(c.Id))
            .ToListAsync();

        var recipe = new Recipe
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Servings = request.Servings,
            PrepTimeMinutes = request.PrepTimeMinutes,
            CookTimeMinutes = request.CookTimeMinutes,
            Steps = request.Steps,
            CreatedById = userId,
            Ingredients = request.Ingredients.Select(i => new Ingredient
            {
                Name = i.Name.Trim(),
                Amount = i.Amount,
                Unit = i.Unit.Trim(),
            }).ToList(),
            Categories = categories,
        };

        db.Recipes.Add(recipe);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = recipe.Id }, ToDetailDto(recipe));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] RecipeRequest request)
    {
        var recipe = await db.Recipes
            .Include(r => r.Ingredients)
            .Include(r => r.Categories)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recipe is null)
            return NotFound();

        var categories = await db.Categories
            .Where(c => request.CategoryIds.Contains(c.Id))
            .ToListAsync();

        recipe.Title = request.Title.Trim();
        recipe.Description = request.Description?.Trim();
        recipe.Servings = request.Servings;
        recipe.PrepTimeMinutes = request.PrepTimeMinutes;
        recipe.CookTimeMinutes = request.CookTimeMinutes;
        recipe.Steps = request.Steps;
        recipe.Categories = categories;

        db.Ingredients.RemoveRange(recipe.Ingredients);
        recipe.Ingredients = request.Ingredients.Select(i => new Ingredient
        {
            Name = i.Name.Trim(),
            Amount = i.Amount,
            Unit = i.Unit.Trim(),
        }).ToList();

        await db.SaveChangesAsync();

        return Ok(ToDetailDto(recipe));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var recipe = await db.Recipes.FindAsync(id);
        if (recipe is null)
            return NotFound();

        db.Recipes.Remove(recipe);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static RecipeDetailDto ToDetailDto(Recipe recipe) => new(
        recipe.Id,
        recipe.Title,
        recipe.Description,
        recipe.Servings,
        recipe.PrepTimeMinutes,
        recipe.CookTimeMinutes,
        recipe.Steps,
        recipe.Ingredients.Select(i => new IngredientDto(i.Id, i.Name, i.Amount, i.Unit)).ToList(),
        recipe.Categories.Select(c => new CategoryDto(c.Id, c.Name)).ToList());
}

