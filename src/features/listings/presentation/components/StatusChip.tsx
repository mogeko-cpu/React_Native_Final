import React from "react";

import { Pill } from "@/src/core/components/Chips";
import { IconName } from "@/src/core/ui/icons";
import { brand } from "@/src/theme/theme";
import { ListingStatus, statusLabel } from "../../domain/entities/Listing";

// Color e ícono de cada estado (`status_chip.dart`).
export function statusStyleOf(status: ListingStatus): { color: string; icon: IconName } {
  switch (status) {
    case "idea":
      return { color: brand.orange, icon: "lightbulb-outline" };
    case "inProgress":
      return { color: brand.blue, icon: "play-circle-outline" };
    case "paused":
      return { color: brand.grey, icon: "pause-circle-outline" };
    case "done":
      return { color: brand.green, icon: "check-circle-outline" };
  }
}

export function StatusChip({ status }: { status: ListingStatus }) {
  const style = statusStyleOf(status);
  return <Pill icon={style.icon} label={statusLabel(status)} color={style.color} />;
}
