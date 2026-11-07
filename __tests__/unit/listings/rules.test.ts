import { draftListing, isRecruiting, Listing, memberCount, roleOf, teamOf } from "@/src/features/listings/domain/entities/Listing";
import { emptyStats } from "@/src/features/listings/domain/entities/ListingStats";
import { ListingTask, percentOf, progressLabel, progressOf } from "@/src/features/listings/domain/entities/ListingTask";
import { rank } from "@/src/features/listings/domain/entities/RankedListing";

const base = (): Listing => ({ ...draftListing({ title: "Proyecto", description: "x", category: "Tecnología", creatorId: "c", creatorName: "Creadora", maxMembers: 2, requiredSkills: [] }), id: "l1" });

describe("reglas de un proyecto", () => {
  it("un integrante viejo sin rol es líder si creó el proyecto", () => {
    const listing = { ...base(), memberIds: ["c", "m"], members: [] };
    expect(roleOf(listing, "c")).toBe("leader");
    expect(roleOf(listing, "m")).toBe("member");
    expect(teamOf(listing)[0].userName).toBe("Creadora");
  });

  it("el mentor no ocupa cupo", () => {
    const listing: Listing = {
      ...base(),
      memberIds: ["c", "m", "p"],
      members: [
        { userId: "c", userName: "C", role: "leader" },
        { userId: "m", userName: "M", role: "member" },
        { userId: "p", userName: "P", role: "mentor" },
      ],
    };
    expect(memberCount(listing)).toBe(2);
    expect(isRecruiting(listing)).toBe(false);
  });

  it("el avance no cuenta las canceladas", () => {
    const task = (column: ListingTask["column"]): ListingTask => ({
      id: column,
      listingId: "l1",
      title: "t",
      assigneeId: "",
      assigneeName: "",
      dueDate: null,
      column,
      createdById: "c",
      createdAt: new Date(),
    });
    const progress = progressOf([task("done"), task("todo"), task("cancelled")]);
    expect(percentOf(progress)).toBe(50);
    expect(progressLabel(progress)).toBe("1 de 2 tareas hechas");
  });

  it("ordena el ranking por puntaje y desempata por comentarios", () => {
    const a = { ...base(), id: "a", title: "A" };
    const b = { ...base(), id: "b", title: "B" };
    const c = { ...base(), id: "c", title: "C" };
    const ranked = rank([a, b, c], { a: { ...emptyStats, likes: 1 }, b: { ...emptyStats, likes: 1, comments: 2 }, c: { ...emptyStats, likes: 3, dislikes: 1 } }, emptyStats);
    expect(ranked.map((r) => r.listing.id)).toEqual(["c", "b", "a"]);
    expect(ranked[0].position).toBe(1);
  });
});
