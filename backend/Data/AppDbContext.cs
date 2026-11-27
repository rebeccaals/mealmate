using Mealmate.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Mealmate.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser>(options)
{
    public DbSet<Oppskrift> Oppskrifter => Set<Oppskrift>();
    public DbSet<Ingrediens> Ingredienser => Set<Ingrediens>();
    public DbSet<Kategori> Kategorier => Set<Kategori>();
    public DbSet<Ukesmeny> Ukesmenyer => Set<Ukesmeny>();
    public DbSet<Måltid> Måltider => Set<Måltid>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Oppskrift>()
            .HasMany(o => o.Kategorier)
            .WithMany(k => k.Oppskrifter);

        // One måltid per dag + måltidstype in an ukesmeny
        builder.Entity<Måltid>()
            .HasIndex(m => new { m.UkesmenyId, m.Dag, m.Måltidstype })
            .IsUnique();

        builder.Entity<Måltid>()
            .Property(m => m.Notat)
            .HasMaxLength(200);

        // Join table with readable column names: MåltidOppskrift(MåltidId, OppskriftId).
        // Deleting an oppskrift only removes it from måltider; the måltid itself stays.
        builder.Entity<Måltid>()
            .HasMany(m => m.Oppskrifter)
            .WithMany()
            .UsingEntity(
                "MåltidOppskrift",
                r => r.HasOne(typeof(Oppskrift)).WithMany().HasForeignKey("OppskriftId"),
                l => l.HasOne(typeof(Måltid)).WithMany().HasForeignKey("MåltidId"));
    }
}
