// Si Roble se puede alcanzar, según la última petición. No hay una señal de
// red confiable en todas las plataformas, así que la verdad la dicen las
// respuestas: una lectura que falla por red marca «sin conexión» y la
// siguiente que funciona lo quita. En la web también cuentan los eventos
// `online`/`offline` del navegador.
type Listener = (offline: boolean) => void;

class Connectivity {
  private offline = false;
  private readonly listeners = new Set<Listener>();

  get isOffline() {
    return this.offline;
  }

  markOffline() {
    this.set(true);
  }

  markOnline() {
    this.set(false);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(offline: boolean) {
    if (this.offline === offline) return;
    this.offline = offline;
    for (const listener of this.listeners) listener(offline);
  }
}

export const connectivity = new Connectivity();

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("offline", () => connectivity.markOffline());
  window.addEventListener("online", () => connectivity.markOnline());
}
