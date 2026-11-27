using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/kategorier")]
[Authorize]
public class KategorierController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetKategorier()
    {
        var kategorier = await db.Kategorier
            .OrderBy(k => k.Navn)
            .Select(k => new KategoriDto(k.Id, k.Navn))
            .ToListAsync();

        return Ok(kategorier);
    }

    [HttpPost]
    public async Task<IActionResult> CreateKategori([FromBody] KategoriRequest request)
    {
        var kategori = new Kategori { Navn = request.Navn.Trim() };
        db.Kategorier.Add(kategori);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetKategorier), new KategoriDto(kategori.Id, kategori.Navn));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateKategori(Guid id, [FromBody] KategoriRequest request)
    {
        var kategori = await db.Kategorier.FindAsync(id);
        if (kategori is null)
            return NotFound();

        kategori.Navn = request.Navn.Trim();
        await db.SaveChangesAsync();

        return Ok(new KategoriDto(kategori.Id, kategori.Navn));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteKategori(Guid id)
    {
        var kategori = await db.Kategorier
            .Include(k => k.Oppskrifter)
            .FirstOrDefaultAsync(k => k.Id == id);

        if (kategori is null)
            return NotFound();

        if (kategori.Oppskrifter.Count > 0)
            return Conflict("Kategorien brukes av én eller flere oppskrifter.");

        db.Kategorier.Remove(kategori);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
