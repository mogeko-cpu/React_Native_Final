import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { View } from "react-native";

import { AppTextField } from "@/src/core/components/AppTextField";
import { FilledIconButton } from "@/src/core/components/Buttons";
import { TagChip, Wrap } from "@/src/core/components/Chips";
import { T } from "@/src/core/components/T";
import { useAppTheme } from "@/src/theme/theme";

// El título de cada bloque del formulario.
export function FormLabel({ text }: { text: string }) {
  return (
    <T v="titleSmall" w={700}>
      {text}
    </T>
  );
}

// «Tamaño del equipo»: el slider y el número de personas al lado.
export function TeamSizeSlider({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Slider
        testID="team-size"
        style={{ flex: 1, height: 44 }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.primaryContainer}
        thumbTintColor={theme.colors.primary}
      />
      <T v="bodySmall" style={{ width: 84, marginLeft: 8 }}>
        {`${value} personas`}
      </T>
    </View>
  );
}

// «Habilidades que buscas»: campo, botón + y los chips que se pueden quitar.
export function SkillsEditor({
  skills,
  onAdd,
  onRemove,
  placeholder,
  testID = "skill",
}: {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
  placeholder: string;
  testID?: string;
}) {
  const [text, setText] = useState("");
  const add = () => {
    onAdd(text);
    setText("");
  };
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <AppTextField testID={`${testID}-input`} placeholder={placeholder} value={text} onChangeText={setText} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} />
        </View>
        <View style={{ marginLeft: 8 }}>
          <FilledIconButton testID={`${testID}-add`} accessibilityLabel="Agregar habilidad" icon="plus" onPress={add} />
        </View>
      </View>
      {skills.length > 0 && (
        <Wrap style={{ marginTop: 12 }}>
          {skills.map((skill) => (
            <TagChip key={skill} label={skill} onDelete={() => onRemove(skill)} />
          ))}
        </Wrap>
      )}
    </View>
  );
}
