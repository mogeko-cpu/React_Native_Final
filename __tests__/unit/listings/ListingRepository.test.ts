import { DummyData } from "@/src/core/data/dummyData";
import { ListingInMemoryDataSource } from "@/src/features/listings/data/datasources/ListingInMemoryDataSource";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { normalizeUrl } from "@/src/features/listings/data/repositories/ProjectFileRepositoryImpl";
import { draftListing, isLeader, roleOf } from "@/src/features/listings/domain/entities/Listing";

function setup() {
  const data = new DummyData(false);
  const repo = new ListingRepositoryImpl(new ListingInMemoryDataSource(data));
  return { data, repo };
}

const draft = (maxMembers = 2) =>
  draftListing({ title: "Huerta urbana", description: "Una huerta comunitaria en la terraza", category: "Sostenibilidad", creatorId: "ana", creatorName: "Ana", maxMembers, requiredSkills: ["Agronomía"] });

describe("ListingRepositoryImpl", () => {
  it("publicar deja al creador como líder", async () => {
    const { repo } = setup();
    const saved = await repo.createListing(draft());
    const stored = await repo.getListingById(saved.id);
    expect(stored && isLeader(stored, "ana")).toBe(true);
  });

  it("aceptar una solicitud agrega a la persona y no deja postularse dos veces", async () => {
    const { repo } = setup();
    const saved = await repo.createListing(draft());
    const request = await repo.createJoinRequest({ listingId: saved.id, applicantId: "beto", applicantName: "Beto", motivation: "Me interesa mucho", skills: "Riego", availability: "Lunes" });
    await expect(repo.createJoinRequest({ listingId: saved.id, applicantId: "beto", applicantName: "Beto", motivation: "Otra vez", skills: "", availability: "" })).rejects.toThrow(
      "Ya enviaste una solicitud a este proyecto.",
    );
    await repo.acceptJoinRequest(request.id);
    const stored = await repo.getListingById(saved.id);
    expect(stored && roleOf(stored, "beto")).toBe("member");
    expect((await repo.getMyRequestForListing(saved.id, "beto"))?.status).toBe("accepted");
  });

  it("solo el líder edita, y el equipo no puede quedar más grande que el tamaño", async () => {
    const { repo } = setup();
    const saved = await repo.createListing(draft(3));
    await expect(repo.updateListing({ ...saved, title: "Otro título" }, "beto")).rejects.toThrow("Solo el líder del proyecto puede editar el proyecto.");
    await expect(repo.updateListing({ ...saved, maxMembers: 1 }, "ana")).rejects.toThrow(/de 2 a 12/);
    const edited = await repo.updateListing({ ...saved, status: "inProgress" }, "ana");
    expect(edited.status).toBe("inProgress");
  });

  it("transferir el liderazgo deja al anterior como integrante", async () => {
    const { repo } = setup();
    const saved = await repo.createListing(draft(3));
    const request = await repo.createJoinRequest({ listingId: saved.id, applicantId: "beto", applicantName: "Beto", motivation: "Quiero ayudar", skills: "x", availability: "y" });
    await repo.acceptJoinRequest(request.id);
    await repo.transferLeadership({ listingId: saved.id, newLeaderId: "beto", actorId: "ana" });
    const stored = (await repo.getListingById(saved.id))!;
    expect(roleOf(stored, "beto")).toBe("leader");
    expect(roleOf(stored, "ana")).toBe("member");
    await expect(repo.leaveListing({ listingId: saved.id, userId: "beto" })).rejects.toThrow(/transfiere el liderazgo/);
  });

  it("un proyecto terminado no recibe solicitudes", async () => {
    const { repo } = setup();
    const saved = await repo.createListing(draft());
    await repo.updateListing({ ...saved, status: "done" }, "ana");
    await expect(repo.createJoinRequest({ listingId: saved.id, applicantId: "beto", applicantName: "Beto", motivation: "m", skills: "s", availability: "a" })).rejects.toThrow(/ya no recibe solicitudes/);
  });

  it("normaliza los enlaces que se comparten", () => {
    expect(normalizeUrl("drive.google.com/x")).toBe("https://drive.google.com/x");
    expect(normalizeUrl("usuario:clave@sitio.com")).toBeNull();
    expect(normalizeUrl("no es un enlace")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
  });
});
