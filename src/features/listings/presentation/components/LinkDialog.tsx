import React, { useEffect, useState } from "react";

import { AppDialog } from "@/src/core/components/AppDialog";
import { AppTextField } from "@/src/core/components/AppTextField";
import { AppButton } from "@/src/core/components/Buttons";
import { Gap } from "@/src/core/components/Screen";

// Agregar un enlace a la carpeta del equipo (`link_dialog.dart`).
export function LinkDialog({ visible, onCancel, onSave }: { visible: boolean; onCancel: () => void; onSave: (form: { name: string; url: string }) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (visible) {
      // Cargar al abrir: el estado cambia después del `await`, no al instante.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName("");
      setUrl("");
    }
  }, [visible]);
  const complete = name.trim() !== "" && url.trim() !== "";
  return (
    <AppDialog
      visible={visible}
      title="Agregar enlace"
      onDismiss={onCancel}
      actions={
        <>
          <AppButton mode="text" onPress={onCancel}>
            Cancelar
          </AppButton>
          <AppButton testID="link-save" disabled={!complete} onPress={() => onSave({ name, url })}>
            Guardar enlace
          </AppButton>
        </>
      }
    >
      <AppTextField testID="link-name" label="Nombre del enlace" placeholder="Ej. Carpeta del informe final" value={name} onChangeText={setName} autoFocus />
      <Gap h={12} />
      <AppTextField testID="link-url" label="Enlace" placeholder="https://drive.google.com/…" value={url} onChangeText={setUrl} keyboardType="url" autoCapitalize="none" />
    </AppDialog>
  );
}
