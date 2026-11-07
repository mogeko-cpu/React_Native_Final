import { Row } from "@/src/core/roble/guard";

// Las solicitudes de mentoría (`mentorship_requests`), en filas.
export interface MentorshipDataSource {
  readRequests(filters: Record<string, string>): Promise<Row[]>;
  insertRequest(row: Row): Promise<Row>;
  deleteRequest(id: string): Promise<void>;
}
