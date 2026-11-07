import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { AppRoot } from "@/App";
import { DummyData } from "@/src/core/data/dummyData";
import { createLocalContainer } from "@/src/core/di/localContainer";

jest.setTimeout(30000);

// La app entera con los datos en memoria: entrar, ver Inicio, abrir un proyecto.
describe("Campus Innovate", () => {
  it("entra con la cuenta de demostración y abre un proyecto", async () => {
    render(<AppRoot container={createLocalContainer(new DummyData())} />);

    expect(await screen.findByText("Campus Innovate")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("login-email"), DummyData.demoEmail);
    fireEvent.changeText(screen.getByTestId("login-password"), DummyData.demoPassword);
    await act(async () => {
      fireEvent.press(screen.getByTestId("login-submit"));
    });

    expect(await screen.findByText("Hola, Mariana")).toBeTruthy();
    expect(await screen.findByText("Ideas destacadas")).toBeTruthy();
    expect(await screen.findByText("Te piden ser mentor")).toBeTruthy();

    const card = (await screen.findAllByText("Plataforma de tutorías entre pares"))[0];
    await act(async () => {
      fireEvent.press(card);
    });
    expect(await screen.findByText("Este es tu proyecto.")).toBeTruthy();
    expect(await screen.findByText("Espacio del equipo")).toBeTruthy();
    expect(await screen.findByText("2 de 6 tareas hechas")).toBeTruthy();
  });
});
