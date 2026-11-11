import { RobleApiClient, RobleApiNetworkException } from "roble-client";

import { connectivity } from "@/src/core/network/connectivity";
import { OFFLINE_WRITE, RobleClient } from "@/src/core/roble/RobleClient";
import { fake } from "../../support/fake";

describe("Sin conexión", () => {
  afterEach(() => connectivity.markOnline());

  it("muestra lo último leído y rechaza las escrituras con un mensaje claro", async () => {
    let online = true;
    const db = fake<RobleApiClient>({
      read: async () => {
        if (!online) throw new RobleApiNetworkException("sin red");
        return [{ _id: "1", title: "Huerta" }];
      },
      create: async () => {
        if (!online) throw new RobleApiNetworkException("sin red");
        return { _id: "2" };
      },
    });
    const client = new RobleClient({ baseUrl: "https://x", contractId: "prueba" }, db);

    expect(await client.read("listings", { status: "idea" })).toHaveLength(1);
    expect(connectivity.isOffline).toBe(false);

    online = false;
    expect(await client.read("listings", { status: "idea" })).toEqual([{ _id: "1", title: "Huerta" }]);
    expect(connectivity.isOffline).toBe(true);
    // Una lectura que nunca se hizo no tiene nada que mostrar.
    await expect(client.read("groups")).rejects.toBeInstanceOf(RobleApiNetworkException);
    await expect(client.insert("listings", { title: "Otra" })).rejects.toThrow(OFFLINE_WRITE);

    // Al volver la red, la siguiente petición quita el aviso.
    online = true;
    await client.insert("listings", { title: "Otra" });
    expect(connectivity.isOffline).toBe(false);
  });
});
