import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { LinearProgress } from "@/src/core/components/LinearProgress";

import { AppButton } from "@/src/core/components/Buttons";
import { EmptyState } from "@/src/core/components/EmptyState";
import { Gap, Loading, Screen } from "@/src/core/components/Screen";
import { Panel } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { useConfirm } from "@/src/core/feedback/DialogProvider";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { RootStackParamList } from "@/src/navigation/types";
import { useAppTheme } from "@/src/theme/theme";
import { ProjectFile } from "../../domain/entities/ProjectFile";
import { LinkDialog } from "../components/LinkDialog";
import { ProjectFileTile } from "../components/ProjectFileTile";
import { useFilesViewModel } from "../viewmodels/useFilesViewModel";

const countLabel = (uploads: number, links: number) =>
  `${uploads} ${uploads === 1 ? "archivo" : "archivos"} · ${links} ${links === 1 ? "enlace" : "enlaces"}`;

// La carpeta del equipo (`files_page.dart`): subir archivos de hasta 10 MB o
// compartir enlaces.
export default function FilesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { listingId } = useRoute<RouteProp<RootStackParamList, "Files">>().params;
  const vm = useFilesViewModel(listingId);
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const [linkDialog, setLinkDialog] = useState(false);

  useLayoutEffect(() => {
    const title = vm.listing?.title;
    navigation.setOptions({ title: title ? `Archivos · ${title}` : "Archivos" });
  }, [navigation, vm.listing?.title]);

  const upload = async () => {
    const done = await vm.upload();
    if (done == null) return;
    snackbar(done ? "Archivo subido" : "No se pudo subir", done ? "El equipo ya lo puede abrir" : (vm.lastActionError() ?? "Intenta de nuevo"));
  };

  const addLink = async (form: { name: string; url: string }) => {
    setLinkDialog(false);
    const done = await vm.addLink(form);
    snackbar(done ? "Enlace guardado" : "No se pudo guardar", done ? "El equipo ya lo puede abrir" : (vm.lastActionError() ?? "Intenta de nuevo"));
  };

  const open = async (file: ProjectFile) => {
    if (!(await vm.open(file))) snackbar("No se pudo abrir", vm.lastActionError() ?? "Intenta de nuevo");
  };

  const remove = async (file: ProjectFile) => {
    const ok = await confirm({ title: `¿Eliminar "${file.name}"?`, message: "Nadie del equipo lo va a poder abrir de nuevo.", confirmLabel: "Eliminar" });
    if (ok && !(await vm.remove(file))) snackbar("No se pudo eliminar", vm.lastActionError() ?? "Intenta de nuevo");
  };

  if (vm.isLoading) return <Screen><Loading /></Screen>;
  if (vm.error || !vm.listing) {
    return (
      <Screen>
        <EmptyState icon="lock-outline" title="No se pudieron abrir los archivos" message={vm.error ?? "Proyecto no encontrado"} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={vm.load} colors={[theme.colors.primary]} />}>
        <Panel title="Carpeta del equipo" icon="folder-account-outline">
          <T v="labelLarge" w={700}>
            {countLabel(vm.uploadCount, vm.linkCount)}
          </T>
          <T v="bodySmall" color={theme.colors.onSurfaceVariant} style={{ marginTop: 6 }}>
            Todo lo que suba cualquiera del equipo aparece aquí. Hasta 10 MB por archivo; para algo más grande, comparte un enlace.
          </T>
          <Gap h={14} />
          <AppButton testID="files-upload" tall icon="file-upload-outline" disabled={vm.isWorking} onPress={upload}>
            Subir archivo
          </AppButton>
          <Gap h={10} />
          <AppButton testID="files-add-link" tall mode="outlined" icon="link-plus" disabled={vm.isWorking} onPress={() => setLinkDialog(true)}>
            Agregar enlace
          </AppButton>
          {vm.uploading != null && (
            <>
              <LinearProgress color={theme.colors.primary} track={theme.colors.primaryContainer} height={6} style={{ marginTop: 14 }} />
              <T v="bodySmall" style={{ marginTop: 6 }}>{`Subiendo "${vm.uploading}"…`}</T>
            </>
          )}
        </Panel>
        <Gap h={18} />
        {vm.files.length === 0 ? (
          <EmptyState inline icon="folder-open-outline" title="Todavía no hay archivos" message="Sube documentos o imágenes, o comparte enlaces a Drive, GitHub o Figma." />
        ) : (
          vm.files.map((file) => (
            <ProjectFileTile key={file.id} file={file} canDelete={vm.canDelete(file)} isBusy={vm.isWorking} onOpen={() => open(file)} onDelete={() => remove(file)} />
          ))
        )}
      </ScrollView>
      <LinkDialog visible={linkDialog} onCancel={() => setLinkDialog(false)} onSave={addLink} />
    </Screen>
  );
}
