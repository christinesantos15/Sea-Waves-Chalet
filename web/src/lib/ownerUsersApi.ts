export type InternalUserRole =
  | "owner"
  | "operator"
  | "staff";


export type CreatableUserRole =
  | "operator"
  | "staff";


export type OwnerManagedUser = {
  id: number;
  username: string;
  role: InternalUserRole;
  is_active: boolean;
  created_at: string;
};


export type CreateInternalUser = {
  username: string;
  password: string;
  role: CreatableUserRole;
};


export type PasswordResetResponse = {
  status: string;
  user_id: number;
  username: string;
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


export async function getOwnerUsers(): Promise<
  OwnerManagedUser[]
> {
  const response = await fetch(
    `${API_BASE_URL}/owner/users`,
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
    OwnerManagedUser[]
  >;
}


export async function createOwnerUser(
  data: CreateInternalUser,
): Promise<OwnerManagedUser> {
  const response = await fetch(
    `${API_BASE_URL}/owner/users`,
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
    OwnerManagedUser
  >;
}


export async function setOwnerUserActive(
  userId: number,
  isActive: boolean,
): Promise<OwnerManagedUser> {
  const response = await fetch(
    `${API_BASE_URL}/owner/users/${userId}/active`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    OwnerManagedUser
  >;
}


export async function resetOwnerUserPassword(
  userId: number,
  password: string,
): Promise<PasswordResetResponse> {
  const response = await fetch(
    `${API_BASE_URL}/owner/users/${userId}/password`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }

  return response.json() as Promise<
    PasswordResetResponse
  >;
}