import { UserFacingError } from "@/src/core/utils/failure";

export class ListingFailure extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = "ListingFailure";
  }
}
