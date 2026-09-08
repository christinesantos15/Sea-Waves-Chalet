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

export type OperatorPayment = {
  id: number;
  reservation_id: number;

  amount: string;

  payment_type: string;
  payment_method: string | null;

  status: string;

  reference: string | null;
  notes: string | null;

  paid_at: string | null;
  created_at: string;
};

export type OperatorPaymentStatus =
  | "unpriced"
  | "unpaid"
  | "partial"
  | "paid";

export type OperatorPaymentSummary = {
  reservation_id: number;
  reservation_reference: string;

  total_amount: string;
  paid_amount: string;
  balance: string;

  payment_status: OperatorPaymentStatus;

  payments: OperatorPayment[];
};

export type OperatorPaymentCreate = {
  amount: string;

  payment_type:
    | "deposit"
    | "balance"
    | "full"
    | "other";

  payment_method: string | null;
  reference: string | null;
  notes: string | null;
};

export type OperatorDailyOperationsCounts = {
  arrivals: number;
  staying: number;
  departures: number;
};

export type OperatorDailyOperations = {
  date: string;

  counts: OperatorDailyOperationsCounts;

  arrivals: OperatorReservation[];
  staying: OperatorReservation[];
  departures: OperatorReservation[];
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

  if (
    body &&
    Array.isArray(body.detail)
  ) {
    const firstError =
      body.detail[0]?.msg;

    if (
      typeof firstError === "string"
    ) {
      return firstError;
    }
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
      credentials: "include",
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

export async function checkInReservation(
  reservationId: number,
): Promise<OperatorReservation> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/check-in`,
    {
      method: "PATCH",
      credentials: "include",
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

export async function checkOutReservation(
  reservationId: number,
): Promise<OperatorReservation> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/check-out`,
    {
      method: "PATCH",
      credentials: "include",
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

export async function getReservationPayments(
  reservationId: number,
): Promise<OperatorPaymentSummary> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/payments`,
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
    OperatorPaymentSummary
  >;
}

export async function updateReservationAmount(
  reservationId: number,
  totalAmount: string,
): Promise<OperatorPaymentSummary> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/amount`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        total_amount: totalAmount,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorPaymentSummary
  >;
}

export async function recordReservationPayment(
  reservationId: number,
  payment: OperatorPaymentCreate,
): Promise<OperatorPaymentSummary> {
  const response = await fetch(
    `${API_BASE_URL}/operator/reservations/${reservationId}/payments`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payment),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorPaymentSummary
  >;
}

export async function getOperatorDailyOperations(
  date: string,
): Promise<OperatorDailyOperations> {
  const params = new URLSearchParams({
    date,
  });

  const response = await fetch(
    `${API_BASE_URL}/operator/daily-operations?${params.toString()}`,
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
    OperatorDailyOperations
  >;
}