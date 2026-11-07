import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

import { mimeTypeOf } from "../utils/mime";

// Un archivo elegido por la persona, ya leído (`i_file_picker.dart`).
export type PickedFile = {
  name: string;
  data: ArrayBuffer;
  sizeBytes: number;
  mimeType: string | null;
};

export interface FilePicker {
  // `null` si la persona cerró el selector sin elegir.
  pickFile(): Promise<PickedFile | null>;
}

// El selector del sistema (`expo-document-picker`). Los bytes se leen enteros:
// el tope de 10 MB es de la app justamente por eso.
export class SystemFilePicker implements FilePicker {
  async pickFile(): Promise<PickedFile | null> {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0];
    const data =
      Platform.OS === "web" && asset.file ? await asset.file.arrayBuffer() : await (await fetch(asset.uri)).arrayBuffer();
    return {
      name: asset.name,
      data,
      sizeBytes: asset.size ?? data.byteLength,
      mimeType: asset.mimeType ?? mimeTypeOf(asset.name),
    };
  }
}
