using System.Security.Claims;
using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/oppskrifter")]
[Authorize]
public class OppskrifterController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOppskrifter()
    {
        var oppskrifter = await db.Oppskrifter
            .Include(o => o.Kategorier)
            .OrderByDescending(o => o.Opprettet)
            .Select(o => new OppskriftListDto(
                o.Id,
                o.Tittel,
                o.Beskrivelse,
                o.Porsjoner,
                o.ForberedelsestidMinutter,
                o.TilberedningstidMinutter,
                o.Kategorier.Select(k => new KategoriDto(k.Id, k.Navn)).ToList()))
            .ToListAsync();

        return Ok(oppskrifter);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOppskrift(Guid id)
    {
        var oppskrift = await db.Oppskrifter
            .Include(o => o.Ingredienser)
            .Include(o => o.Kategorier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (oppskrift is null)
            return NotFound();

        return Ok(ToDetailDto(oppskrift));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOppskrift([FromBody] OppskriftRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var kategorier = await db.Kategorier
            .Where(k => request.KategoriIder.Contains(k.Id))
            .ToListAsync();

        var oppskrift = new Oppskrift
        {
            Tittel = request.Tittel.Trim(),
            Beskrivelse = request.Beskrivelse?.Trim(),
            Porsjoner = request.Porsjoner,
            ForberedelsestidMinutter = request.ForberedelsestidMinutter,
            TilberedningstidMinutter = request.TilberedningstidMinutter,
            Steg = request.Steg,
            OpprettetAvId = userId,
            Ingredienser = ToIngredienser(request.Ingredienser),
            Kategorier = kategorier,
        };

        db.Oppskrifter.Add(oppskrift);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOppskrift), new { id = oppskrift.Id }, ToDetailDto(oppskrift));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateOppskrift(Guid id, [FromBody] OppskriftRequest request)
    {
        var oppskrift = await db.Oppskrifter
            .Include(o => o.Ingredienser)
            .Include(o => o.Kategorier)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (oppskrift is null)
            return NotFound();

        var kategorier = await db.Kategorier
            .Where(k => request.KategoriIder.Contains(k.Id))
            .ToListAsync();

        oppskrift.Tittel = request.Tittel.Trim();
        oppskrift.Beskrivelse = request.Beskrivelse?.Trim();
        oppskrift.Porsjoner = request.Porsjoner;
        oppskrift.ForberedelsestidMinutter = request.ForberedelsestidMinutter;
        oppskrift.TilberedningstidMinutter = request.TilberedningstidMinutter;
        oppskrift.Steg = request.Steg;
        oppskrift.Kategorier = kategorier;

        db.Ingredienser.RemoveRange(oppskrift.Ingredienser);
        oppskrift.Ingredienser = ToIngredienser(request.Ingredienser);

        await db.SaveChangesAsync();

        return Ok(ToDetailDto(oppskrift));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOppskrift(Guid id)
    {
        var oppskrift = await db.Oppskrifter.FindAsync(id);
        if (oppskrift is null)
            return NotFound();

        db.Oppskrifter.Remove(oppskrift);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static List<Ingrediens> ToIngredienser(List<IngrediensRequestItem> items) =>
        items.Select(i => new Ingrediens
        {
            Navn = i.Navn.Trim(),
            Mengde = i.Mengde,
            Enhet = i.Enhet.Trim(),
        }).ToList();

    private static OppskriftDetailDto ToDetailDto(Oppskrift oppskrift) => new(
        oppskrift.Id,
        oppskrift.Tittel,
        oppskrift.Beskrivelse,
        oppskrift.Porsjoner,
        oppskrift.ForberedelsestidMinutter,
        oppskrift.TilberedningstidMinutter,
        oppskrift.Steg,
        oppskrift.Ingredienser.Select(i => new IngrediensDto(i.Id, i.Navn, i.Mengde, i.Enhet)).ToList(),
        oppskrift.Kategorier.Select(k => new KategoriDto(k.Id, k.Navn)).ToList());
}
