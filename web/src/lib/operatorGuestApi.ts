export type OperatorGuest = {
  id: number;

  full_name: string;

  phone: string | null;
  email: string | null;

  facebook_name: string | null;
  messenger_psid: string | null;

  notes: string | null;

  inquiry_count: number;
  reservation_count: number;
};


export type OperatorGuestInquiryHistory = {
  id: number;

  source: string;
  status: string;

  check_in: string | null;
  check_out: string | null;

  guest_count: number | null;

  message: string | null;

  created_at: string;
};


export type OperatorGuestReservationHistory = {
  id: number;
  reference: string;

  cottage_id: number;
  room_id: number | null;
  inquiry_id: number | null;

  source: string;
  status: string;

  check_in: string;
  check_out: string;

  guest_count: number;

  total_amount: string;

  notes: string | null;

  created_at: string;
};


export type OperatorGuestDetail =
  OperatorGuest & {
    inquiries: OperatorGuestInquiryHistory[];

    reservations: OperatorGuestReservationHistory[];
  };


export type OperatorGuestUpdate = {
  full_name?: string;

  phone?: string | null;
  email?: string | null;

  facebook_name?: string | null;
  messenger_psid?: string | null;

  notes?: string | null;
};


export type OperatorGuestFilters = {
  q?: string;
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


export async function getOperatorGuests(
  filters: OperatorGuestFilters = {},
): Promise<OperatorGuest[]> {
  const params =
    new URLSearchParams();

  const query =
    filters.q?.trim();

  if (query) {
    params.set(
      "q",
      query,
    );
  }

  const queryString =
    params.toString();

  const response = await fetch(
    queryString
      ? `${API_BASE_URL}/operator/guests?${queryString}`
      : `${API_BASE_URL}/operator/guests`,
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
    OperatorGuest[]
  >;
}


export async function getOperatorGuest(
  guestId: number,
): Promise<OperatorGuestDetail> {
  const response = await fetch(
    `${API_BASE_URL}/operator/guests/${guestId}`,
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
    OperatorGuestDetail
  >;
}


export async function updateOperatorGuest(
  guestId: number,
  data: OperatorGuestUpdate,
): Promise<OperatorGuestDetail> {
  const response = await fetch(
    `${API_BASE_URL}/operator/guests/${guestId}`,
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        data,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorGuestDetail
  >;
}
