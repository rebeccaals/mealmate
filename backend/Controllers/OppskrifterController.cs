using System.Security.Claims;
using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Mealmate.Api.Services;
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
            .Include(o => o.Ingredienser).ThenInclude(i => i.Butikkvare)
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
            Ingredienser = await ToIngredienser(request.Ingredienser),
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
        oppskrift.Ingredienser = await ToIngredienser(request.Ingredienser);

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

        // The oppskrift is removed from any måltider; måltider left with nothing in them are cleaned up
        await db.Måltider
            .Where(m => m.Notat == null && !m.Oppskrifter.Any())
            .ExecuteDeleteAsync();

        return NoContent();
    }

    // Looks up each butikkvare by name (ignoring case) and creates the ones that don't exist yet.
    // The new butikkvarer are tracked by the DbContext and saved together with the oppskrift.
    private async Task<List<Ingrediens>> ToIngredienser(List<IngrediensRequestItem> items)
    {
        var normaliserte = items.Select(i => ButikkvareNavn.Normalisert(i.ButikkvareNavn)).Distinct().ToList();
        var butikkvarer = (await db.Butikkvarer
                .Where(b => normaliserte.Contains(b.Navn.ToLower()))
                .ToListAsync())
            .ToDictionary(b => b.Navn.ToLowerInvariant());

        return items.Select((item, index) =>
        {
            var nøkkel = ButikkvareNavn.Normalisert(item.ButikkvareNavn);
            if (!butikkvarer.TryGetValue(nøkkel, out var butikkvare))
            {
                butikkvare = new Butikkvare
                {
                    Navn = ButikkvareNavn.Pent(item.ButikkvareNavn),
                    Avdeling = item.Avdeling ?? Avdeling.Annet,
                };
                db.Butikkvarer.Add(butikkvare);
                butikkvarer[nøkkel] = butikkvare;
            }

            return new Ingrediens
            {
                Rekkefølge = index,
                Butikkvare = butikkvare,
                Mengde = item.Mengde,
                Enhet = item.Enhet,
                Merknad = string.IsNullOrWhiteSpace(item.Merknad) ? null : item.Merknad.Trim(),
            };
        }).ToList();
    }

    private static OppskriftDetailDto ToDetailDto(Oppskrift oppskrift) => new(
        oppskrift.Id,
        oppskrift.Tittel,
        oppskrift.Beskrivelse,
        oppskrift.Porsjoner,
        oppskrift.ForberedelsestidMinutter,
        oppskrift.TilberedningstidMinutter,
        oppskrift.Steg,
        oppskrift.Ingredienser
            .OrderBy(i => i.Rekkefølge)
            .Select(i => new IngrediensDto(i.Id, i.ButikkvareId, i.Butikkvare.Navn, i.Butikkvare.Avdeling, i.Mengde, i.Enhet, i.Merknad))
            .ToList(),
        oppskrift.Kategorier.Select(k => new KategoriDto(k.Id, k.Navn)).ToList());
}
