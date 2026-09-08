export type RoomDetail = {
  id: number;
  cottage_id: number;
  code: string;
  name: string;
  description: string | null;
  capacity: number | null;
  base_rate: string | number | null;
  status: string;
  is_active: boolean;
};

export type CottageDetail = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  capacity: number | null;
  base_rate: string | number | null;
  status: string;
  is_active: boolean;
  map_x: string | number | null;
  map_y: string | number | null;
  rooms: RoomDetail[];
};

export type RoomAvailability = {
  id: number;
  code: string;
  name: string;
  capacity: number | null;
  base_rate: string | number | null;
  status: string;
  available: boolean;
};

export type CottageAvailability = {
  cottage_id: number;
  cottage_code: string;
  cottage_name: string;
  check_in: string;
  check_out: string;
  rooms: RoomAvailability[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8001";

export async function getCottageDetail(
  cottageId: number,
  signal?: AbortSignal,
): Promise<CottageDetail> {
  const response = await fetch(
    `${API_BASE_URL}/cottages/${cottageId}`,
    {
      method: "GET",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load cottage: ${response.status}`,
    );
  }

  return response.json() as Promise<CottageDetail>;
}

export async function getCottageAvailability(
  cottageId: number,
  checkIn: string,
  checkOut: string,
  signal?: AbortSignal,
): Promise<CottageAvailability> {
  const params = new URLSearchParams({
    check_in: checkIn,
    check_out: checkOut,
  });

  const response = await fetch(
    `${API_BASE_URL}/cottages/${cottageId}/availability?${params.toString()}`,
    {
      method: "GET",
      signal,
    },
  );

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => null);

    if (
      body &&
      typeof body.detail === "string"
    ) {
      throw new Error(body.detail);
    }

    throw new Error(
      `Failed to check availability: ${response.status}`,
    );
  }

  return response.json() as Promise<CottageAvailability>;
}