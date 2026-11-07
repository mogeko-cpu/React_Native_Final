import React from "react";

import { ChoiceChip, Pill } from "@/src/core/components/Chips";
import { categoryStyleOf } from "@/src/core/ui/categoryStyle";
import { useAppTheme } from "@/src/theme/theme";

// La pastilla de la categoría en tarjetas y detalle.
export function CategoryPill({ category }: { category: string }) {
  const theme = useAppTheme();
  const style = categoryStyleOf(category, theme.colors.primary);
  return <Pill icon={style.icon} label={category} color={style.color} />;
}

// El chip para elegir categoría, pintado de su color (`category_choice_chip.dart`).
export function CategoryChoiceChip({ category, selected, onPress }: { category: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  const style = categoryStyleOf(category, theme.colors.primary);
  return <ChoiceChip testID={`category-${category}`} label={category} selected={selected} onPress={onPress} icon={style.icon} iconColor={style.color} color={style.color} />;
}
