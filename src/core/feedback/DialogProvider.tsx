import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Dialog, Portal } from "react-native-paper";

import { useAppTheme } from "@/src/theme/theme";
import { AppButton } from "../components/Buttons";
import { T } from "../components/T";

type ConfirmOptions = { title: string; message: string; confirmLabel: string };
type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const DialogContext = createContext<Confirm | null>(null);

// `confirmAction` de Flutter (`confirm_dialog.dart`): un diálogo de
// «¿seguro?» con Cancelar y la acción, que responde `true` solo si se confirma.
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <DialogContext.Provider value={confirm}>
      {children}
      <Portal>
        <Dialog visible={options != null} onDismiss={() => close(false)} style={{ borderRadius: 24, backgroundColor: theme.colors.raised }}>
          <Dialog.Title>
            <T v="headlineSmall">{options?.title ?? ""}</T>
          </Dialog.Title>
          <Dialog.Content>
            <T v="bodyMedium" color={theme.colors.onSurfaceVariant}>
              {options?.message ?? ""}
            </T>
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton mode="text" onPress={() => close(false)}>
              Cancelar
            </AppButton>
            <AppButton testID="confirm-dialog-ok" onPress={() => close(true)}>
              {options?.confirmLabel ?? "Aceptar"}
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </DialogContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const ctx = useContext(DialogContext);
  return ctx ?? (async () => true);
}
