using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Mealmate.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/butikkvarer")]
[Authorize]
public class ButikkvarerController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetButikkvarer()
    {
        var butikkvarer = await db.Butikkvarer
            .OrderBy(b => b.Navn)
            .Select(b => new ButikkvareDto(
                b.Id,
                b.Navn,
                b.Avdeling,
                b.Ingredienser.Select(i => i.OppskriftId).Distinct().Count()))
            .ToListAsync();

        return Ok(butikkvarer);
    }

    // Bulk create: one name per entry. Names that already exist (ignoring case) are skipped.
    [HttpPost]
    public async Task<IActionResult> CreateButikkvarer([FromBody] CreateButikkvarerRequest request)
    {
        var nye = request.Navn
            .Select(ButikkvareNavn.Pent)
            .Where(n => n.Length > 0)
            .DistinctBy(ButikkvareNavn.Normalisert)
            .ToList();

        var normaliserte = nye.Select(ButikkvareNavn.Normalisert).ToList();
        var finnes = await db.Butikkvarer
            .Where(b => normaliserte.Contains(b.Navn.ToLower()))
            .Select(b => b.Navn.ToLower())
            .ToListAsync();

        var opprettet = nye
            .Where(n => !finnes.Contains(ButikkvareNavn.Normalisert(n)))
            .Select(n => new Butikkvare { Navn = n, Avdeling = request.Avdeling })
            .ToList();

        db.Butikkvarer.AddRange(opprettet);
        await db.SaveChangesAsync();

        return Ok(opprettet.Select(b => new ButikkvareDto(b.Id, b.Navn, b.Avdeling, 0)).ToList());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateButikkvare(Guid id, [FromBody] UpdateButikkvareRequest request)
    {
        var butikkvare = await db.Butikkvarer.FindAsync(id);
        if (butikkvare is null)
            return NotFound();

        var navn = ButikkvareNavn.Pent(request.Navn);
        var normalisert = ButikkvareNavn.Normalisert(navn);
        if (await db.Butikkvarer.AnyAsync(b => b.Id != id && b.Navn.ToLower() == normalisert))
            return Conflict($"Det finnes allerede en butikkvare som heter «{navn}». Slå dem sammen i stedet.");

        butikkvare.Navn = navn;
        butikkvare.Avdeling = request.Avdeling;
        await db.SaveChangesAsync();

        var antall = await db.Ingredienser.Where(i => i.ButikkvareId == id).Select(i => i.OppskriftId).Distinct().CountAsync();
        return Ok(new ButikkvareDto(butikkvare.Id, butikkvare.Navn, butikkvare.Avdeling, antall));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteButikkvare(Guid id)
    {
        var butikkvare = await db.Butikkvarer.FindAsync(id);
        if (butikkvare is null)
            return NotFound();

        if (await db.Ingredienser.AnyAsync(i => i.ButikkvareId == id))
            return Conflict("Butikkvaren brukes i en oppskrift. Slå den sammen med en annen i stedet.");

        db.Butikkvarer.Remove(butikkvare);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // Merges a duplicate into another butikkvare: every ingrediens pointing at {id} is moved to
    // MålId, then {id} is deleted. E.g. "Meierismør" → "Smør".
    [HttpPost("{id:guid}/sla-sammen")]
    public async Task<IActionResult> SlåSammen(Guid id, [FromBody] SlåSammenRequest request)
    {
        if (id == request.MålId)
            return BadRequest("Kan ikke slå sammen en butikkvare med seg selv.");

        var kilde = await db.Butikkvarer.FindAsync(id);
        var mål = await db.Butikkvarer.FindAsync(request.MålId);
        if (kilde is null || mål is null)
            return NotFound();

        await db.Ingredienser
            .Where(i => i.ButikkvareId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.ButikkvareId, mål.Id));

        db.Butikkvarer.Remove(kilde);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
