export type OperatorRoom = {
  id: number;
  cottage_id: number;
  room_type_id: number | null;
  code: string;
  name: string;
  description: string | null;
  capacity: number | null;
  base_rate: string | number | null;
  status: string;
  is_active: boolean;
};

export type CottageMedia = {
  id: number;
  cottage_id: number;
  media_type: "image" | "video";
  url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

export type OperatorCottage = {
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
  rooms: OperatorRoom[];
  media: CottageMedia[];
};

export type OperatorCottageUpdate = {
  name?: string;
  description?: string | null;
  capacity?: number | null;
  base_rate?: number | null;
  status?: string;
  is_active?: boolean;
};

export type CottageMediaCreate = {
  media_type: "image" | "video";
  url: string;
  alt_text?: string | null;
  caption?: string | null;
  sort_order?: number;
  is_cover?: boolean;
  is_active?: boolean;
};

export type CottageMediaUpdate = {
  media_type?: "image" | "video";
  url?: string;
  alt_text?: string | null;
  caption?: string | null;
  sort_order?: number;
  is_cover?: boolean;
  is_active?: boolean;
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

export async function getOperatorCottages(): Promise<
  OperatorCottage[]
> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages`,
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
    OperatorCottage[]
  >;
}

export async function getOperatorCottage(
  cottageId: number,
): Promise<OperatorCottage> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}`,
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
    OperatorCottage
  >;
}

export async function updateOperatorCottage(
  cottageId: number,
  data: OperatorCottageUpdate,
): Promise<OperatorCottage> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}`,
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
    OperatorCottage
  >;
}

export async function createCottageMedia(
  cottageId: number,
  data: CottageMediaCreate,
): Promise<CottageMedia> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}/media`,
    {
      method: "POST",
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
    CottageMedia
  >;
}

export async function updateCottageMedia(
  cottageId: number,
  mediaId: number,
  data: CottageMediaUpdate,
): Promise<CottageMedia> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}/media/${mediaId}`,
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
    CottageMedia
  >;
}

export async function deactivateCottageMedia(
  cottageId: number,
  mediaId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}/media/${mediaId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }
}


export async function updateOperatorRoomType(
  cottageId: number,
  roomId: number,
  roomTypeId: number | null,
): Promise<OperatorRoom> {
  const response = await fetch(
    `${API_BASE_URL}/operator/cottages/${cottageId}/rooms/${roomId}/room-type`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_type_id: roomTypeId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorRoom
  >;
}
