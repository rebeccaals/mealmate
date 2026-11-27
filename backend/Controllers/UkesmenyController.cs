using Mealmate.Api.Data;
using Mealmate.Api.DTOs;
using Mealmate.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Controllers;

[ApiController]
[Route("api/ukesmeny")]
[Authorize]
public class UkesmenyController(AppDbContext db) : ControllerBase
{
    private const string UgyldigUkestart = "ukestart må være en mandag på formatet YYYY-MM-DD.";

    [HttpGet]
    public async Task<IActionResult> GetUkesmeny([FromQuery] string ukestart)
    {
        if (!TryParseUkestart(ukestart, out var dato))
            return BadRequest(UgyldigUkestart);

        var ukesmeny = await db.Ukesmenyer
            .Include(u => u.Måltider)
            .ThenInclude(m => m.Oppskrift)
            .FirstOrDefaultAsync(u => u.Ukestart == dato);

        if (ukesmeny is null)
            return Ok(new UkesmenyDto(ukestart, []));

        var måltider = ukesmeny.Måltider
            .Select(m => new MåltidDto(m.Id, m.Dag, m.Måltidstype, m.OppskriftId, m.Oppskrift.Tittel))
            .ToList();

        return Ok(new UkesmenyDto(ukestart, måltider));
    }

    [HttpPost("{ukestart}/maltider")]
    public async Task<IActionResult> AddMåltid(string ukestart, [FromBody] AddMåltidRequest request)
    {
        if (!TryParseUkestart(ukestart, out var dato))
            return BadRequest(UgyldigUkestart);

        var oppskrift = await db.Oppskrifter.FindAsync(request.OppskriftId);
        if (oppskrift is null)
            return NotFound("Fant ikke oppskriften.");

        var ukesmeny = await db.Ukesmenyer
            .Include(u => u.Måltider)
            .FirstOrDefaultAsync(u => u.Ukestart == dato);

        if (ukesmeny is null)
        {
            ukesmeny = new Ukesmeny { Ukestart = dato };
            db.Ukesmenyer.Add(ukesmeny);
        }

        // Erstatter eksisterende måltid på samme dag og måltidstype
        var eksisterende = ukesmeny.Måltider
            .FirstOrDefault(m => m.Dag == request.Dag && m.Måltidstype == request.Måltidstype);
        if (eksisterende is not null)
            db.Måltider.Remove(eksisterende);

        var måltid = new Måltid
        {
            Dag = request.Dag,
            Måltidstype = request.Måltidstype,
            OppskriftId = request.OppskriftId,
            Ukesmeny = ukesmeny,
        };
        db.Måltider.Add(måltid);
        await db.SaveChangesAsync();

        return Ok(new MåltidDto(måltid.Id, måltid.Dag, måltid.Måltidstype, oppskrift.Id, oppskrift.Tittel));
    }

    [HttpDelete("{ukestart}/maltider/{måltidId:guid}")]
    public async Task<IActionResult> RemoveMåltid(string ukestart, Guid måltidId)
    {
        if (!TryParseUkestart(ukestart, out var dato))
            return BadRequest(UgyldigUkestart);

        var måltid = await db.Måltider
            .Include(m => m.Ukesmeny)
            .FirstOrDefaultAsync(m => m.Id == måltidId && m.Ukesmeny.Ukestart == dato);

        if (måltid is null)
            return NotFound();

        db.Måltider.Remove(måltid);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static bool TryParseUkestart(string ukestart, out DateOnly dato) =>
        DateOnly.TryParse(ukestart, out dato) && dato.DayOfWeek == DayOfWeek.Monday;
}
