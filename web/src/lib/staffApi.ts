export type HousekeepingStatus =
  | "open"
  | "in_progress"
  | "completed";

export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "resolved";

export type TaskPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type RoomReadinessStatus =
  | "available"
  | "needs_cleaning"
  | "cleaning"
  | string;

export type HousekeepingTask = {
  id: number;

  cottage_id: number | null;
  cottage_code: string | null;
  cottage_name: string | null;

  room_id: number | null;
  room_code: string | null;
  room_name: string | null;

  title: string;
  description: string | null;

  status: HousekeepingStatus;
  priority: TaskPriority;

  assigned_to: string | null;

  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type MaintenanceIssue = {
  id: number;

  cottage_id: number | null;
  cottage_code: string | null;
  cottage_name: string | null;

  location: string | null;

  title: string;
  description: string | null;

  priority: TaskPriority;
  status: MaintenanceStatus;

  reported_by: string | null;

  created_at: string;
  resolved_at: string | null;
};

export type CottageOption = {
  id: number;
  code: string;
  name: string;
};

export type RoomOption = {
  id: number;
  cottage_id: number;

  cottage_code: string;
  cottage_name: string;

  code: string;
  name: string;

  status: RoomReadinessStatus;
  is_active: boolean;
};

export type HousekeepingTaskCreate = {
  cottage_id: number | null;
  room_id: number | null;

  title: string;
  description: string | null;

  priority: TaskPriority;

  assigned_to: string | null;
  due_at: string | null;
};

export type MaintenanceIssueCreate = {
  cottage_id: number | null;

  location: string | null;

  title: string;
  description: string | null;

  priority: TaskPriority;

  reported_by: string | null;
};

type RoomApiResponse = {
  id: number;
  cottage_id: number;

  code: string;
  name: string;

  status: string;
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


export async function getCottageOptions(): Promise<
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
    (await response.json()) as CottageOption[];

  return cottages.map(
    (cottage) => ({
      id: cottage.id,
      code: cottage.code,
      name: cottage.name,
    }),
  );
}


export async function getRoomOptions(
  cottages?: CottageOption[],
): Promise<RoomOption[]> {
  const cottageOptions =
    cottages ??
    (await getCottageOptions());

  const roomGroups =
    await Promise.all(
      cottageOptions.map(
        async (cottage) => {
          const response = await fetch(
            `${API_BASE_URL}/cottages/${cottage.id}/rooms`,
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

          const rooms =
            (await response.json()) as RoomApiResponse[];

          return rooms.map(
            (room): RoomOption => ({
              id: room.id,
              cottage_id:
                room.cottage_id,

              cottage_code:
                cottage.code,
              cottage_name:
                cottage.name,

              code: room.code,
              name: room.name,

              status: room.status,
              is_active:
                room.is_active,
            }),
          );
        },
      ),
    );

  return roomGroups.flat();
}


export async function getHousekeepingTasks(
  status?: HousekeepingStatus,
): Promise<HousekeepingTask[]> {
  const params =
    new URLSearchParams();

  if (status) {
    params.set(
      "status",
      status,
    );
  }

  const query =
    params.toString();

  const response = await fetch(
    `${API_BASE_URL}/staff/housekeeping${
      query ? `?${query}` : ""
    }`,
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

  return response.json() as Promise<
    HousekeepingTask[]
  >;
}


export async function createHousekeepingTask(
  data: HousekeepingTaskCreate,
): Promise<HousekeepingTask> {
  const response = await fetch(
    `${API_BASE_URL}/staff/housekeeping`,
    {
      method: "POST",
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
    HousekeepingTask
  >;
}


export async function updateHousekeepingStatus(
  taskId: number,
  status: HousekeepingStatus,
): Promise<HousekeepingTask> {
  const response = await fetch(
    `${API_BASE_URL}/staff/housekeeping/${taskId}/status`,
    {
      method: "PATCH",
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
    HousekeepingTask
  >;
}


export async function getMaintenanceIssues(
  status?: MaintenanceStatus,
): Promise<MaintenanceIssue[]> {
  const params =
    new URLSearchParams();

  if (status) {
    params.set(
      "status",
      status,
    );
  }

  const query =
    params.toString();

  const response = await fetch(
    `${API_BASE_URL}/staff/maintenance${
      query ? `?${query}` : ""
    }`,
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

  return response.json() as Promise<
    MaintenanceIssue[]
  >;
}


export async function createMaintenanceIssue(
  data: MaintenanceIssueCreate,
): Promise<MaintenanceIssue> {
  const response = await fetch(
    `${API_BASE_URL}/staff/maintenance`,
    {
      method: "POST",
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
    MaintenanceIssue
  >;
}


export async function updateMaintenanceStatus(
  issueId: number,
  status: MaintenanceStatus,
): Promise<MaintenanceIssue> {
  const response = await fetch(
    `${API_BASE_URL}/staff/maintenance/${issueId}/status`,
    {
      method: "PATCH",
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
    MaintenanceIssue
  >;
}