import { UserFacingError } from "@/src/core/utils/failure";

export class GroupFailure extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = "GroupFailure";
  }
}
