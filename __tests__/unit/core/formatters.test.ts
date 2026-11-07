import { initialsOf, readableSize, shortDay, timeAgo } from "@/src/core/utils/formatters";
import { isDuplicateRow, isRowId, stringsOf } from "@/src/core/roble/guard";
import { PasswordPolicy } from "@/src/core/roble/passwordPolicy";

describe("formatos", () => {
  it("dice hace cuánto pasó algo", () => {
    const now = new Date("2026-11-06T12:00:00Z");
    expect(timeAgo(new Date("2026-11-06T11:59:40Z"), now)).toBe("ahora");
    expect(timeAgo(new Date("2026-11-06T11:15:00Z"), now)).toBe("hace 45 min");
    expect(timeAgo(new Date("2026-11-06T09:00:00Z"), now)).toBe("hace 3 h");
    expect(timeAgo(new Date("2026-11-03T12:00:00Z"), now)).toBe("hace 3 d");
  });

  it("muestra el año solo si no es el actual", () => {
    const now = new Date(2026, 10, 6);
    expect(shortDay("2026-11-15", now)).toBe("15 nov");
    expect(shortDay("2027-01-02", now)).toBe("2 ene 2027");
  });

  it("calcula iniciales y tamaños", () => {
    expect(initialsOf("Mariana Ospina")).toBe("MO");
    expect(initialsOf("  ")).toBe("?");
    expect(readableSize(512)).toBe("512 B");
    expect(readableSize(1536 * 1024)).toBe("1,5 MB");
  });
});

describe("Roble", () => {
  it("reconoce un uuid y un duplicado", () => {
    expect(isRowId("3f1c2a4e-1111-4222-8333-444455556666")).toBe(true);
    expect(isRowId("123")).toBe(false);
    expect(isDuplicateRow(new Error('duplicate key value violates unique constraint "x" (23505)'))).toBe(true);
    expect(isDuplicateRow(new Error("otra cosa"))).toBe(false);
  });

  it("lee las habilidades aunque vengan como texto", () => {
    expect(stringsOf(["A", "B"])).toEqual(["A", "B"]);
    expect(stringsOf('["A","B"]')).toEqual(["A", "B"]);
    expect(stringsOf("Diseño")).toEqual(["Diseño"]);
    expect(stringsOf(null)).toEqual([]);
  });

  it("aplica la política de contraseñas antes de gastar un registro", () => {
    expect(PasswordPolicy.validate("corta")).toMatch(/8 caracteres/);
    expect(PasswordPolicy.validate("sinmayuscula1!")).toMatch(/mayúscula/);
    expect(PasswordPolicy.validate("Sinsimbolo1")).toMatch(/símbolos/);
    expect(PasswordPolicy.validate("Campus123!")).toBeNull();
  });
});
