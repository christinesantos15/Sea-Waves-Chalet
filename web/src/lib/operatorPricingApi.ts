export type RoomRate = {
  id: number;
  room_type_id: number;
  rate_plan:
    | "with_breakfast"
    | "without_breakfast";
  amount: string | number;
  is_active: boolean;
};

export type RoomTypePricing = {
  id: number;
  code: string;
  name: string;
  capacity: number;
  is_active: boolean;
  rates: RoomRate[];
};

export type ExtraCharge = {
  id: number;
  code: string;
  name: string;
  amount: string | number;
  is_active: boolean;
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

export async function getRoomTypes(): Promise<
  RoomTypePricing[]
> {
  const response = await fetch(
    `${API_BASE_URL}/operator/pricing/room-types`,
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
    RoomTypePricing[]
  >;
}

export async function updateRoomType(
  roomTypeId: number,
  data: {
    name?: string;
    capacity?: number;
    is_active?: boolean;
  },
): Promise<RoomTypePricing> {
  const response = await fetch(
    `${API_BASE_URL}/operator/pricing/room-types/${roomTypeId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    RoomTypePricing
  >;
}

export async function updateRoomRate(
  roomTypeId: number,
  rateId: number,
  data: {
    amount?: number;
    is_active?: boolean;
  },
): Promise<RoomRate> {
  const response = await fetch(
    `${API_BASE_URL}/operator/pricing/room-types/${roomTypeId}/rates/${rateId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    RoomRate
  >;
}

export async function getExtraCharges(): Promise<
  ExtraCharge[]
> {
  const response = await fetch(
    `${API_BASE_URL}/operator/pricing/extra-charges`,
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
    ExtraCharge[]
  >;
}

export async function updateExtraCharge(
  chargeId: number,
  data: {
    name?: string;
    amount?: number;
    is_active?: boolean;
  },
): Promise<ExtraCharge> {
  const response = await fetch(
    `${API_BASE_URL}/operator/pricing/extra-charges/${chargeId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    ExtraCharge
  >;
}
