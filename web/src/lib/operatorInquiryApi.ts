export type InquirySource =
  | "messenger"
  | "facebook"
  | "website"
  | "walk_in"
  | "phone"
  | "manual";


export type InquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "declined"
  | "closed";


export type EditableInquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "declined"
  | "closed";


export type OperatorInquiry = {
  id: number;

  guest_id: number;
  guest_name: string;

  guest_phone: string | null;
  guest_email: string | null;

  facebook_name: string | null;
  messenger_psid: string | null;

  source: InquirySource;
  status: InquiryStatus;

  check_in: string | null;
  check_out: string | null;

  guest_count: number | null;

  message: string | null;

  created_at: string;
};


export type OperatorInquiryCreate = {
  full_name: string;

  phone: string | null;
  email: string | null;

  facebook_name: string | null;
  messenger_psid: string | null;

  source: InquirySource;

  check_in: string | null;
  check_out: string | null;

  guest_count: number | null;

  message: string | null;
};


export type OperatorInquiryConversion = {
  inquiry_id: number;
  inquiry_status: InquiryStatus;

  reservation_id: number;
  reservation_reference: string;
  reservation_status: string;

  guest_id: number;

  cottage_id: number;
  room_id: number;

  check_in: string;
  check_out: string;

  guest_count: number;
};


export type CottageOption = {
  id: number;
  code: string;
  name: string;
};


type CottageApiItem = {
  id: number;
  code: string;
  name: string;
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


export async function getOperatorInquiries(): Promise<
  OperatorInquiry[]
> {
  const response = await fetch(
    `${API_BASE_URL}/operator/inquiries`,
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
    OperatorInquiry[]
  >;
}


export async function createOperatorInquiry(
  data: OperatorInquiryCreate,
): Promise<OperatorInquiry> {
  const response = await fetch(
    `${API_BASE_URL}/operator/inquiries`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
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
    OperatorInquiry
  >;
}


export async function updateOperatorInquiryStatus(
  inquiryId: number,
  status: EditableInquiryStatus,
): Promise<OperatorInquiry> {
  const response = await fetch(
    `${API_BASE_URL}/operator/inquiries/${inquiryId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
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
    OperatorInquiry
  >;
}


export async function convertOperatorInquiry(
  inquiryId: number,
  cottageId: number,
  roomId: number,
  notes: string | null = null,
): Promise<OperatorInquiryConversion> {
  const response = await fetch(
    `${API_BASE_URL}/operator/inquiries/${inquiryId}/convert`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        cottage_id: cottageId,
        room_id: roomId,
        notes,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OperatorInquiryConversion
  >;
}


export async function getInquiryCottageOptions(): Promise<
  CottageOption[]
> {
  const response = await fetch(
    `${API_BASE_URL}/cottages`,
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

  const cottages =
    (await response.json()) as CottageApiItem[];

  return cottages
    .filter(
      (cottage) =>
        cottage.is_active !== false,
    )
    .map(
      (cottage) => ({
        id: cottage.id,
        code: cottage.code,
        name: cottage.name,
      }),
    );
}