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
    }
}
