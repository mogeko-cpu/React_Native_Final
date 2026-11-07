import React from "react";
import { View } from "react-native";

import { AppButton } from "@/src/core/components/Buttons";
import { NameAvatar } from "@/src/core/components/NameAvatar";
import { Card } from "@/src/core/components/Surfaces";
import { T } from "@/src/core/components/T";
import { alpha, useAppTheme } from "@/src/theme/theme";
import { GroupInvitation } from "../../domain/entities/Group";

// Una invitación a un grupo, con Aceptar y Rechazar (`invitation_card.dart`).
export function InvitationCard({
  invitation,
  isBusy,
  onAccept,
  onReject,
  onOpenGroup,
}: {
  invitation: GroupInvitation;
  isBusy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onOpenGroup?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Card onPress={onOpenGroup} style={{ marginBottom: 12 }} color={theme.dark ? alpha(theme.colors.primaryContainer, 0.5) : "#FBEFF1"}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <NameAvatar name={invitation.inviterName} radius={18} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T v="titleSmall" w={700} numberOfLines={1}>
              {invitation.groupName || "Invitación a un grupo"}
            </T>
            <T v="bodySmall" color={theme.colors.onSurfaceVariant}>
              {`${invitation.inviterName} te invitó a unirte`}
            </T>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          <AppButton mode="text" disabled={isBusy} onPress={onReject}>
            Rechazar
          </AppButton>
          <AppButton testID={`invitation-accept-${invitation.id}`} disabled={isBusy} onPress={onAccept}>
            Aceptar
          </AppButton>
        </View>
      </View>
    </Card>
  );
}
