import { UserFacingError } from "@/src/core/utils/failure";

export class AuthFailure extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = "AuthFailure";
  }
}
