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