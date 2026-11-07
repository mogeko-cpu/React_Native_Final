import { DummyData } from "@/src/core/data/dummyData";
import { AuthInMemoryDataSource } from "@/src/features/auth/data/datasources/AuthInMemoryDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";

describe("AuthRepositoryImpl", () => {
  it("entra con la cuenta de demostración y rechaza una contraseña mala", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData()));
    await expect(repo.login(DummyData.demoEmail, "mala")).rejects.toThrow("Correo o contraseña incorrectos.");
    const user = await repo.login(DummyData.demoEmail, DummyData.demoPassword);
    expect(user.name).toBe("Mariana Ospina");
    expect(await repo.restoreSession()).toEqual(user);
    await repo.logout();
    expect(await repo.restoreSession()).toBeNull();
  });

  it("revisa la contraseña antes de crear la cuenta", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData(false)));
    await expect(repo.signUp("Ana Ruiz", "ana@uninorte.edu.co", "debil")).rejects.toThrow(/8 caracteres/);
    await repo.signUp("Ana Ruiz", "ana@uninorte.edu.co", "Fuerte123!");
    expect((await repo.login("ana@uninorte.edu.co", "Fuerte123!")).name).toBe("Ana Ruiz");
  });

  it("en el teléfono, Google responde con un mensaje sin gastar una petición", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData(false)));
    await expect(repo.startGoogleSignIn()).rejects.toThrow(/versión web/);
  });
});
