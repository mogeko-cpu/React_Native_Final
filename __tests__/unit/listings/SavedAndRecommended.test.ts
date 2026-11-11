import { DummyData } from "@/src/core/data/dummyData";
import { ListingInMemoryDataSource } from "@/src/features/listings/data/datasources/ListingInMemoryDataSource";
import { SavedListingInMemoryDataSource } from "@/src/features/listings/data/datasources/SavedListingInMemoryDataSource";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { SavedListingRepositoryImpl } from "@/src/features/listings/data/repositories/SavedListingRepositoryImpl";
import { draftListing, Listing } from "@/src/features/listings/domain/entities/Listing";
import { applyReaction, emptyStats } from "@/src/features/listings/domain/entities/ListingStats";
import { recommendListings } from "@/src/features/listings/domain/recommendations";

function setup() {
  const data = new DummyData(false);
  const listings = new ListingRepositoryImpl(new ListingInMemoryDataSource(data));
  const saved = new SavedListingRepositoryImpl(new SavedListingInMemoryDataSource(data), listings);
  return { listings, saved };
}

const draft = (title: string, skills: string[]) =>
  draftListing({ title, description: "Una descripción suficientemente larga", category: "Tecnología", creatorId: "lider", creatorName: "Líder", maxMembers: 4, requiredSkills: skills });

describe("Guardar proyectos", () => {
  it("guardar dos veces no duplica, quitar lo saca y los borrados se ignoran", async () => {
    const { listings, saved } = setup();
    const a = await listings.createListing(draft("A", []));
    const b = await listings.createListing(draft("B", []));
    await saved.save("ana", a.id);
    await saved.save("ana", a.id);
    await saved.save("ana", b.id);
    expect((await saved.getSavedIds("ana")).sort()).toEqual([a.id, b.id].sort());

    await listings.deleteListing(b.id);
    expect((await saved.getSavedListings("ana")).map((l) => l.title)).toEqual(["A"]);

    await saved.unsave("ana", a.id);
    await saved.unsave("ana", a.id);
    expect(await saved.getSavedListings("ana")).toEqual([]);
  });
});

describe("Recomendados para ti", () => {
  const listing = (id: string, skills: string[], extra: Partial<Listing> = {}): Listing => ({ ...draft(id, skills), id, ...extra });

  it("ordena por habilidades en común y deja fuera lo que no sirve", () => {
    const all = [
      listing("uno", ["Python"]),
      listing("dos", ["python", "Estadística"]),
      listing("lleno", ["Python"], { maxMembers: 1 }),
      listing("pausado", ["Python"], { status: "paused" }),
      listing("mio", ["Python"], { memberIds: ["lider", "ana"] }),
      listing("nada", ["Ventas"]),
    ];
    const result = recommendListings(all, ["Python", "estadistica"], "ana");
    expect(result.map((r) => r.listing.id)).toEqual(["dos", "uno"]);
    expect(result[0].matched).toEqual(["python", "Estadística"]);
  });

  it("sin habilidades no recomienda nada", () => {
    expect(recommendListings([listing("uno", ["Python"])], [], "ana")).toEqual([]);
  });
});

describe("Reacciones al instante", () => {
  it("tocar la misma quita, tocar la otra reemplaza", () => {
    const liked = applyReaction({ ...emptyStats, likes: 2 }, "like");
    expect(liked).toMatchObject({ likes: 3, myReaction: "like" });
    expect(applyReaction(liked, "like")).toMatchObject({ likes: 2, myReaction: null });
    expect(applyReaction(liked, "dislike")).toMatchObject({ likes: 2, dislikes: 1, myReaction: "dislike" });
  });
});
