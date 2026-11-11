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

  it("recupera la contraseña y entra con la nueva", async () => {
    render(<AppRoot container={createLocalContainer(new DummyData())} />);
    expect(await screen.findByText("Campus Innovate")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("login-forgot"));
    });
    fireEvent.changeText(await screen.findByTestId("forgot-email"), DummyData.demoEmail);
    await act(async () => {
      fireEvent.press(screen.getByTestId("forgot-submit"));
    });

    fireEvent.changeText(await screen.findByTestId("reset-code"), DummyData.demoCode);
    fireEvent.changeText(screen.getByTestId("reset-password"), "Nueva123!");
    fireEvent.changeText(screen.getByTestId("reset-confirmation"), "Nueva123!");
    await act(async () => {
      fireEvent.press(screen.getByTestId("reset-submit"));
    });
    expect(await screen.findByText("Contraseña actualizada")).toBeTruthy();

    fireEvent.changeText(screen.getByTestId("login-email"), DummyData.demoEmail);
    fireEvent.changeText(screen.getByTestId("login-password"), "Nueva123!");
    await act(async () => {
      fireEvent.press(screen.getByTestId("login-submit"));
    });
    expect(await screen.findByText("Hola, Mariana")).toBeTruthy();
  });

  it("recomienda por habilidades y guarda el proyecto en el Perfil", async () => {
    render(<AppRoot container={createLocalContainer(new DummyData())} />);
    expect(await screen.findByText("Campus Innovate")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("login-email"), DummyData.demoEmail);
    fireEvent.changeText(screen.getByTestId("login-password"), DummyData.demoPassword);
    await act(async () => {
      fireEvent.press(screen.getByTestId("login-submit"));
    });

    expect(await screen.findByText("Recomendados para ti")).toBeTruthy();
    expect(await screen.findByText("Coincide en Python, Estadística")).toBeTruthy();

    const card = (await screen.findAllByText("Sensor de calidad del aire"))[0];
    await act(async () => {
      fireEvent.press(card);
    });
    await act(async () => {
      fireEvent.press(await screen.findByTestId("listing-save"));
    });
    expect(await screen.findByText("Proyecto guardado")).toBeTruthy();

    // La reacción cambia al instante, sin esperar a la escritura.
    const button = await screen.findByLabelText(/^Me gusta, \d+$/);
    const before = Number(String(button.props.accessibilityLabel).split(", ")[1]);
    act(() => {
      fireEvent.press(screen.getByTestId("react-like"));
    });
    // Sin esperar la escritura: el contador ya cambió en este mismo cuadro
    // (sube si no había votado, baja si ya le había dado «me gusta»).
    const after = Number(String(screen.getByLabelText(/^Me gusta, \d+$/).props.accessibilityLabel).split(", ")[1]);
    expect(Math.abs(after - before)).toBe(1);
    await act(async () => undefined);
  });
});
