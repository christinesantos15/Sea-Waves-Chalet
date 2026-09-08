export type OwnerTodayCounts = {
  arrivals: number;
  staying: number;
  departures: number;
};

export type OwnerBookingCounts = {
  pending: number;
  confirmed: number;
  checked_in: number;
};

export type OwnerFinanceSummary = {
  booked_value: string;
  payments_received: string;
  outstanding_balance: string;
  payment_attention: number;
};

export type OwnerRoomSummary = {
  total: number;
  ready: number;
  needs_cleaning: number;
  cleaning: number;
  other: number;
  occupied: number;
  occupancy_percent: number;
};

export type OwnerAttentionSummary = {
  pending_reservations: number;
  payment_attention: number;
  rooms_needing_attention: number;
  open_maintenance: number;
};

export type OwnerRecentReservation = {
  id: number;
  reference: string;

  guest_name: string;

  cottage_name: string;
  room_name: string | null;

  status: string;

  check_in: string;
  check_out: string;

  guest_count: number;
  total_amount: string;

  created_at: string;
};

export type OwnerRecentPayment = {
  id: number;

  reservation_id: number;
  reservation_reference: string;

  guest_name: string;

  amount: string;

  payment_type: string;
  payment_method: string | null;

  reference: string | null;

  paid_at: string | null;
  created_at: string;
};

export type OwnerDashboardData = {
  date: string;

  today: OwnerTodayCounts;
  bookings: OwnerBookingCounts;
  finance: OwnerFinanceSummary;
  rooms: OwnerRoomSummary;
  attention: OwnerAttentionSummary;

  recent_reservations: OwnerRecentReservation[];
  recent_payments: OwnerRecentPayment[];
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

export async function getOwnerDashboard(
  date?: string,
): Promise<OwnerDashboardData> {
  const params =
    new URLSearchParams();

  if (date) {
    params.set(
      "date",
      date,
    );
  }

  const query =
    params.toString();

  const response = await fetch(
    `${API_BASE_URL}/owner/dashboard${
      query
        ? `?${query}`
        : ""
    }`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OwnerDashboardData
  >;
}
