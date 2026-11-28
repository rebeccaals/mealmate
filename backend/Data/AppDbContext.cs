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
    public DbSet<Butikkvare> Butikkvarer => Set<Butikkvare>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Oppskrift>()
            .HasMany(o => o.Kategorier)
            .WithMany(k => k.Oppskrifter);

        // Butikkvare names are unique ignoring case — enforced by a lower("Navn") index created in the
        // migration (EF can't express expression indexes), and by the controllers comparing lowercase.
        builder.Entity<Butikkvare>(b =>
        {
            b.Property(x => x.Navn).HasMaxLength(100);
            b.Property(x => x.Avdeling).HasConversion<string>().HasMaxLength(30);
        });

        builder.Entity<Ingrediens>(i =>
        {
            i.Property(x => x.Enhet).HasConversion<string>().HasMaxLength(10);
            i.Property(x => x.Merknad).HasMaxLength(200);
            // A butikkvare that is used in an oppskrift can't be deleted (merge it instead)
            i.HasOne(x => x.Butikkvare).WithMany(b => b.Ingredienser).OnDelete(DeleteBehavior.Restrict);
        });

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
