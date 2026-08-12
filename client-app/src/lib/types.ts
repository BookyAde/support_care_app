export type ShiftStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type WorkerResponseStatus = "pending" | "accepted" | "declined";

export type ShiftClientDetail = {
  full_name: string;
  address: string;
  contact_number: string;
  care_plan: string | null;
  special_instructions: string | null;
  risk_assessment: string | null;
  medical_notes: string | null;
};

export type Shift = {
  id: string;
  client_id: string;
  worker_id: string;
  client_name: string;
  worker_name: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: ShiftStatus;
  worker_response: WorkerResponseStatus;
  decline_reason: string | null;
  responded_at: string | null;
  is_overdue: boolean;
  client: ShiftClientDetail;
  created_at: string;
};
