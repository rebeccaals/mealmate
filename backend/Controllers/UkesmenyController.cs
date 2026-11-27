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
            .ThenInclude(m => m.Oppskrifter)
            .FirstOrDefaultAsync(u => u.Ukestart == dato);

        var måltider = ukesmeny?.Måltider.Select(ToDto).ToList() ?? [];
        return Ok(new UkesmenyDto(ukestart, måltider));
    }

    // Upsert: sets the whole måltid for one dag + måltidstype.
    // A måltid with no oppskrifter and no notat is removed (returns 204).
    [HttpPut("{ukestart}/maltider/{dag}/{maltidstype}")]
    public async Task<IActionResult> SaveMåltid(
        string ukestart,
        DayOfWeek dag,
        [FromRoute(Name = "maltidstype")] Måltidstype måltidstype,
        [FromBody] SaveMåltidRequest request)
    {
        if (!TryParseUkestart(ukestart, out var dato))
            return BadRequest(UgyldigUkestart);

        var oppskriftIder = request.OppskriftIder.Distinct().ToList();
        var oppskrifter = await db.Oppskrifter
            .Where(o => oppskriftIder.Contains(o.Id))
            .ToListAsync();
        if (oppskrifter.Count != oppskriftIder.Count)
            return BadRequest("Én eller flere oppskrifter finnes ikke.");

        var notat = string.IsNullOrWhiteSpace(request.Notat) ? null : request.Notat.Trim();

        var ukesmeny = await db.Ukesmenyer
            .Include(u => u.Måltider)
            .ThenInclude(m => m.Oppskrifter)
            .FirstOrDefaultAsync(u => u.Ukestart == dato);

        var måltid = ukesmeny?.Måltider
            .FirstOrDefault(m => m.Dag == dag && m.Måltidstype == måltidstype);

        if (oppskrifter.Count == 0 && notat is null)
        {
            if (måltid is not null)
            {
                db.Måltider.Remove(måltid);
                await db.SaveChangesAsync();
            }
            return NoContent();
        }

        if (ukesmeny is null)
        {
            ukesmeny = new Ukesmeny { Ukestart = dato };
            db.Ukesmenyer.Add(ukesmeny);
        }

        if (måltid is null)
        {
            måltid = new Måltid { Dag = dag, Måltidstype = måltidstype, Ukesmeny = ukesmeny };
            db.Måltider.Add(måltid);
        }

        måltid.Porsjoner = request.Porsjoner;
        måltid.Notat = notat;
        måltid.Oppskrifter = oppskrifter;

        await db.SaveChangesAsync();

        return Ok(ToDto(måltid));
    }

    private static MåltidDto ToDto(Måltid m) => new(
        m.Id,
        m.Dag,
        m.Måltidstype,
        m.Porsjoner,
        m.Notat,
        m.Oppskrifter
            .OrderBy(o => o.Tittel)
            .Select(o => new MåltidOppskriftDto(o.Id, o.Tittel))
            .ToList());

    private static bool TryParseUkestart(string ukestart, out DateOnly dato) =>
        DateOnly.TryParse(ukestart, out dato) && dato.DayOfWeek == DayOfWeek.Monday;
}
