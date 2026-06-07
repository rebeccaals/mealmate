using FluentValidation;
using Mealmate.Api.Data;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        var category = new Category { Name = request.Name.Trim() };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new CategoryDto(category.Id, category.Name));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CategoryRequest request)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
            return NotFound();

        category.Name = request.Name.Trim();
        await db.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await db.Categories
            .Include(c => c.Recipes)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return NotFound();

        if (category.Recipes.Count > 0)
            return Conflict("Category is used by one or more recipes.");

        db.Categories.Remove(category);
        await db.SaveChangesAsync();

        return NoContent();
    }
}

public record CategoryDto(Guid Id, string Name);

public record CategoryRequest(string Name);

public class CategoryRequestValidator : AbstractValidator<CategoryRequest>
{
    public CategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}
