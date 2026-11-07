import React from "react";
import { Pressable, View } from "react-native";
import { IconButton } from "react-native-paper";

import { Icon } from "@/src/core/components/Icon";
import { raisedStyle } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { IconName } from "@/src/core/ui/icons";
import { readableSize, timeAgo } from "@/src/core/utils/formatters";
import { alpha, AppTheme, useAppTheme } from "@/src/theme/theme";
import { extensionOf, isLink, ProjectFile } from "../../domain/entities/ProjectFile";

// Una fila de la carpeta del equipo (`project_file_tile.dart`): ícono según el
// tipo, nombre, tamaño o «Enlace», quién lo compartió y cuándo.
export function ProjectFileTile({
  file,
  canDelete,
  isBusy,
  onOpen,
  onDelete,
}: {
  file: ProjectFile;
  canDelete: boolean;
  isBusy: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const style = styleOf(file, theme);
  const kind = isLink(file) ? "Enlace" : readableSize(file.sizeBytes);
  return (
    <View style={[raisedStyle(theme, 16), { marginBottom: 10 }]}>
      <Pressable testID={`file-${file.id}`} onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 4, paddingVertical: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: alpha(style.color, 0.13), alignItems: "center", justifyContent: "center" }}>
          <Icon name={style.icon} color={style.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T v="bodyMedium" w={600} numberOfLines={2}>
            {file.name}
          </T>
          <T v="bodySmall" color={theme.colors.onSurfaceVariant} numberOfLines={1} style={{ marginTop: 2 }}>
            {`${kind} · ${file.uploaderName} · ${timeAgo(file.createdAt)}`}
          </T>
        </View>
        {canDelete ? (
          <IconButton accessibilityLabel="Eliminar archivo" icon="delete-outline" disabled={isBusy} onPress={onDelete} />
        ) : (
          <View style={{ padding: 12 }}>
            <Icon name={isLink(file) ? "open-in-new" : "download-outline"} size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function styleOf(file: ProjectFile, theme: AppTheme): { icon: IconName; color: string } {
  if (isLink(file)) return { icon: "link-variant", color: theme.colors.primary };
  switch (extensionOf(file)) {
    case "pdf":
      return { icon: "file-pdf-box", color: "#D1447A" };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg":
      return { icon: "image-outline", color: "#1B8B9E" };
    case "doc":
    case "docx":
    case "odt":
    case "txt":
    case "md":
      return { icon: "file-document-outline", color: "#2F6FED" };
    case "xls":
    case "xlsx":
    case "csv":
      return { icon: "table", color: "#1E9E6B" };
    case "ppt":
    case "pptx":
      return { icon: "presentation", color: "#E07A1E" };
    case "zip":
    case "rar":
    case "7z":
      return { icon: "folder-zip-outline", color: "#B0793F" };
    case "mp4":
      return { icon: "movie-outline", color: "#7A4FE0" };
    case "mp3":
      return { icon: "music-note-outline", color: "#7A4FE0" };
    default:
      return { icon: "file-outline", color: theme.colors.secondary };
  }
}
