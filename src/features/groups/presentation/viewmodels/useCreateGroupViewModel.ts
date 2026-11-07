import { useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { useErrorState } from "@/src/core/hooks/useErrorState";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/failure";
import { useCurrentUser } from "@/src/features/auth/presentation/context/SessionContext";
import { Group } from "../../domain/entities/Group";
import { GroupRepository } from "../../domain/repositories/GroupRepository";

// Crear un grupo (`create_group_view_model.dart`).
export function useCreateGroupViewModel() {
  const repository = useInject<GroupRepository>(TOKENS.GroupRepo);
  const user = useCurrentUser();
  const [isSaving, setSaving] = useState(false);
  const [error, setError, lastError] = useErrorState();

  const submit = async (name: string, description: string): Promise<Group | null> => {
    setSaving(true);
    setError(null);
    try {
      return await repository.createGroup({ name: name.trim(), description: description.trim(), ownerId: user.id, ownerName: user.name });
    } catch (e) {
      setError(messageOf(e, "No se pudo crear el grupo"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { isSaving, error, lastError, submit };
}
