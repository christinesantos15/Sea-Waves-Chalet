export type UserRole =
  | "owner"
  | "operator"
  | "staff";


export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};


export type LoginRequest = {
  username: string;
  password: string;
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


export async function login(
  data: LoginRequest,
): Promise<AuthUser> {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",

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
    AuthUser
  >;
}


export async function getCurrentUser(): Promise<
  AuthUser
> {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
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
    AuthUser
  >;
}


export async function logout(): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readError(response),
    );
  }
}


export function homeForRole(
  role: UserRole,
): string {
  switch (role) {
    case "owner":
      return "/owner";

    case "operator":
      return "/operator";

    case "staff":
      return "/staff";
  }
}