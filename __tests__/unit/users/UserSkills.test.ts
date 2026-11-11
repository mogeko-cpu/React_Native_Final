import { DummyData } from "@/src/core/data/dummyData";
import { UserInMemoryDataSource } from "@/src/features/users/data/datasources/UserInMemoryDataSource";
import { UserRepositoryImpl } from "@/src/features/users/data/repositories/UserRepositoryImpl";
import { MAX_SKILLS, sameSkill, skillKey } from "@/src/features/users/domain/skills";

describe("Habilidades del Perfil", () => {
  it("compara sin mayúsculas, tildes ni espacios de más", () => {
    expect(skillKey("  Diseño   UI ")).toBe("diseno ui");
    expect(sameSkill("react native", "React  Native")).toBe(true);
    expect(sameSkill("Python", "Pyton")).toBe(false);
  });

  it("agrega, no duplica y quita", async () => {
    const repo = new UserRepositoryImpl(new UserInMemoryDataSource(new DummyData(false)));
    await repo.addSkill("ana", "React Native");
    await repo.addSkill("ana", "react  native");
    await repo.addSkill("ana", "Diseño UI");
    expect(await repo.getSkills("ana")).toEqual(["React Native", "Diseño UI"]);

    await repo.removeSkill("ana", "diseno ui");
    expect(await repo.getSkills("ana")).toEqual(["React Native"]);
    // Las de otra persona no se mezclan.
    expect(await repo.getSkills("beto")).toEqual([]);
    await expect(repo.addSkill("ana", "   ")).rejects.toThrow("Escribe la habilidad.");
  });

  it("tiene un máximo", async () => {
    const repo = new UserRepositoryImpl(new UserInMemoryDataSource(new DummyData(false)));
    for (let i = 0; i < MAX_SKILLS; i++) await repo.addSkill("ana", `Habilidad ${i}`);
    await expect(repo.addSkill("ana", "Una más")).rejects.toThrow(String(MAX_SKILLS));
  });
});
