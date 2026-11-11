import { DummyData } from "@/src/core/data/dummyData";
import { AuthInMemoryDataSource } from "@/src/features/auth/data/datasources/AuthInMemoryDataSource";
import { AuthRepositoryImpl, tokenFrom } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { UnverifiedEmailFailure } from "@/src/features/auth/domain/AuthFailure";

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

  it("revisa la contraseña antes de crear la cuenta y exige verificar el correo", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData(false)));
    await expect(repo.signUp("Ana Ruiz", "ana@uninorte.edu.co", "debil")).rejects.toThrow(/8 caracteres/);
    await repo.signUp("Ana Ruiz", "ana@uninorte.edu.co", "Fuerte123!");

    // Sin el código, entrar lleva a verificar.
    await expect(repo.login("ana@uninorte.edu.co", "Fuerte123!")).rejects.toBeInstanceOf(UnverifiedEmailFailure);
    await expect(repo.verifyEmail("ana@uninorte.edu.co", "12")).rejects.toThrow("6 dígitos");
    await expect(repo.verifyEmail("ana@uninorte.edu.co", "000000")).rejects.toThrow(/no es válido/);
    await repo.verifyEmail("ana@uninorte.edu.co", ` ${DummyData.demoCode} `);

    expect((await repo.login("ana@uninorte.edu.co", "Fuerte123!")).name).toBe("Ana Ruiz");
  });

  it("recupera la contraseña con el código del correo", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData()));
    await expect(repo.requestPasswordReset("no-es-correo")).rejects.toThrow(/correo/);
    await repo.requestPasswordReset(DummyData.demoEmail);

    // La política se revisa antes de gastar la petición.
    await expect(repo.resetPassword(DummyData.demoCode, "corta")).rejects.toThrow(/8 caracteres/);
    await expect(repo.resetPassword("999999", "Nueva123!")).rejects.toThrow(/no es válido/);
    await repo.resetPassword(`https://roble.example/reset?token=${DummyData.demoCode}`, "Nueva123!");

    await expect(repo.login(DummyData.demoEmail, DummyData.demoPassword)).rejects.toThrow("Correo o contraseña incorrectos.");
    expect((await repo.login(DummyData.demoEmail, "Nueva123!")).name).toBe("Mariana Ospina");
  });

  it("acepta el código solo o el enlace completo del correo", () => {
    expect(tokenFrom(" 123 456 ")).toBe("123456");
    expect(tokenFrom("https://app.example/restablecer?token=abc%2Ddef&x=1")).toBe("abc-def");
    expect(tokenFrom("campusinnovate://reset#code=XYZ")).toBe("XYZ");
  });

  it("en el teléfono, sin el destino registrado en Roble, Google responde con un mensaje", async () => {
    const repo = new AuthRepositoryImpl(new AuthInMemoryDataSource(new DummyData(false)));
    await expect(repo.startGoogleSignIn()).rejects.toThrow(/versión web/);
  });
});
