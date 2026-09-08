export type OperatorReservationStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "checked_in"
  | "checked_out";

export type OperatorReservation = {
  id: number;
  reference: string;

  guest_id: number;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;

  cottage_id: number;
  cottage_code: string;
  cottage_name: string;

  room_id: number | null;
  room_code: string | null;
  room_name: string | null;

  source: string;
  status: OperatorReservationStatus;

  check_in: string;
  check_out: string;
  guest_count: number;

  total_amount: string;
  notes: string | null;
  created_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8001";

async function readError(
  response: Response,
): Promise<string> {
  const body = await response
    .json()
    .catch(() => null);

  if (
    body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  return `Request failed: ${response.status}`;
}

export async function getOperatorReservations(
  status: OperatorReservationStatus,
): Promise<OperatorReservation[]> {
  const params = new URLSearchParams({
    status,
  });

  const response = await fetch(
    `${API_BASE_URL}/operator/reservations?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorReservation[]
  >;
}

export async function decideReservation(
  reservationId: number,
  status: "confirmed" | "declined",
): Promise<OperatorReservation> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/decision`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorReservation
  >;
}