"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createHousekeepingTask,
  createMaintenanceIssue,
  getCottageOptions,
  getHousekeepingTasks,
  getMaintenanceIssues,
  getRoomOptions,
  updateHousekeepingStatus,
  updateMaintenanceStatus,
  type CottageOption,
  type HousekeepingStatus,
  type HousekeepingTask,
  type MaintenanceIssue,
  type MaintenanceStatus,
  type RoomOption,
  type TaskPriority,
} from "@/lib/staffApi";


type ViewMode =
  | "housekeeping"
  | "maintenance";


function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}


function priorityClasses(
  priority: TaskPriority,
) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700";

    case "high":
      return "bg-orange-100 text-orange-700";

    case "low":
      return "bg-slate-100 text-slate-600";

    case "normal":
    default:
      return "bg-sky-100 text-sky-700";
  }
}


function housekeepingStatusClasses(
  status: HousekeepingStatus,
) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";

    case "in_progress":
      return "bg-sky-100 text-sky-700";

    case "open":
    default:
      return "bg-amber-100 text-amber-700";
  }
}


function maintenanceStatusClasses(
  status: MaintenanceStatus,
) {
  switch (status) {
    case "resolved":
      return "bg-emerald-100 text-emerald-700";

    case "in_progress":
      return "bg-violet-100 text-violet-700";

    case "open":
    default:
      return "bg-red-100 text-red-700";
  }
}


function roomStatusLabel(
  status: string,
) {
  switch (status) {
    case "available":
      return "Ready";

    case "needs_cleaning":
      return "Needs cleaning";

    case "cleaning":
      return "Cleaning";

    default:
      return status
        .replaceAll("_", " ")
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase(),
        );
  }
}


function roomStatusClasses(
  status: string,
) {
  switch (status) {
    case "available":
      return (
        "border-emerald-200 " +
        "bg-emerald-50 " +
        "text-emerald-700"
      );

    case "needs_cleaning":
      return (
        "border-amber-200 " +
        "bg-amber-50 " +
        "text-amber-800"
      );

    case "cleaning":
      return (
        "border-sky-200 " +
        "bg-sky-50 " +
        "text-sky-700"
      );

    default:
      return (
        "border-slate-200 " +
        "bg-slate-100 " +
        "text-slate-700"
      );
  }
}


function housekeepingLocation(
  task: HousekeepingTask,
) {
  if (
    task.cottage_name &&
    task.room_name
  ) {
    return (
      `${task.cottage_name} · ` +
      task.room_name
    );
  }

  if (task.cottage_name) {
    return task.cottage_name;
  }

  if (task.room_name) {
    return task.room_name;
  }

  return "General resort";
}


export default function StaffOperationsDashboard() {
  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>(
    "housekeeping",
  );

  const [
    housekeepingTasks,
    setHousekeepingTasks,
  ] = useState<
    HousekeepingTask[]
  >([]);

  const [
    maintenanceIssues,
    setMaintenanceIssues,
  ] = useState<
    MaintenanceIssue[]
  >([]);

  const [
    cottages,
    setCottages,
  ] = useState<
    CottageOption[]
  >([]);

  const [
    rooms,
    setRooms,
  ] = useState<
    RoomOption[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    actionId,
    setActionId,
  ] = useState<number | null>(
    null,
  );

  const [
    showHousekeepingForm,
    setShowHousekeepingForm,
  ] = useState(false);

  const [
    showMaintenanceForm,
    setShowMaintenanceForm,
  ] = useState(false);

  const [
    housekeepingCottage,
    setHousekeepingCottage,
  ] = useState("");

  const [
    housekeepingRoom,
    setHousekeepingRoom,
  ] = useState("");

  const [
    housekeepingTitle,
    setHousekeepingTitle,
  ] = useState("");

  const [
    housekeepingDescription,
    setHousekeepingDescription,
  ] = useState("");

  const [
    housekeepingPriority,
    setHousekeepingPriority,
  ] = useState<TaskPriority>(
    "normal",
  );

  const [
    housekeepingAssignedTo,
    setHousekeepingAssignedTo,
  ] = useState("");

  const [
    housekeepingDueAt,
    setHousekeepingDueAt,
  ] = useState("");

  const [
    maintenanceCottage,
    setMaintenanceCottage,
  ] = useState("");

  const [
    maintenanceLocation,
    setMaintenanceLocation,
  ] = useState("");

  const [
    maintenanceTitle,
    setMaintenanceTitle,
  ] = useState("");

  const [
    maintenanceDescription,
    setMaintenanceDescription,
  ] = useState("");

  const [
    maintenancePriority,
    setMaintenancePriority,
  ] = useState<TaskPriority>(
    "normal",
  );

  const [
    maintenanceReportedBy,
    setMaintenanceReportedBy,
  ] = useState("");

  const [
    savingHousekeeping,
    setSavingHousekeeping,
  ] = useState(false);

  const [
    savingMaintenance,
    setSavingMaintenance,
  ] = useState(false);


  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          housekeeping,
          maintenance,
          cottageOptions,
        ] = await Promise.all([
          getHousekeepingTasks(),
          getMaintenanceIssues(),
          getCottageOptions(),
        ]);

        const roomOptions =
          await getRoomOptions(
            cottageOptions,
          );

        setHousekeepingTasks(
          housekeeping,
        );

        setMaintenanceIssues(
          maintenance,
        );

        setCottages(
          cottageOptions,
        );

        setRooms(
          roomOptions,
        );
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            "Could not load staff operations.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);


  const activeRooms =
    useMemo(
      () =>
        rooms.filter(
          (room) =>
            room.is_active,
        ),
      [rooms],
    );


  const readyRooms =
    useMemo(
      () =>
        activeRooms.filter(
          (room) =>
            room.status ===
            "available",
        ),
      [activeRooms],
    );


  const needsCleaningRooms =
    useMemo(
      () =>
        activeRooms.filter(
          (room) =>
            room.status ===
            "needs_cleaning",
        ),
      [activeRooms],
    );


  const cleaningRooms =
    useMemo(
      () =>
        activeRooms.filter(
          (room) =>
            room.status ===
            "cleaning",
        ),
      [activeRooms],
    );


  const otherRooms =
    useMemo(
      () =>
        activeRooms.filter(
          (room) =>
            ![
              "available",
              "needs_cleaning",
              "cleaning",
            ].includes(
              room.status,
            ),
        ),
      [activeRooms],
    );


  const openHousekeepingCount =
    housekeepingTasks.filter(
      (task) =>
        task.status === "open",
    ).length;


  const cleaningTaskCount =
    housekeepingTasks.filter(
      (task) =>
        task.status ===
        "in_progress",
    ).length;


  const openMaintenanceCount =
    maintenanceIssues.filter(
      (issue) =>
        issue.status !==
        "resolved",
    ).length;


  const filteredHousekeepingRooms =
    useMemo(() => {
      if (!housekeepingCottage) {
        return [];
      }

      const cottageId =
        Number(
          housekeepingCottage,
        );

      return activeRooms.filter(
        (room) =>
          room.cottage_id ===
          cottageId,
      );
    }, [
      activeRooms,
      housekeepingCottage,
    ]);


  function getActiveTaskForRoom(
    roomId: number,
  ) {
    const roomTasks =
      housekeepingTasks.filter(
        (task) =>
          task.room_id === roomId &&
          task.status !==
            "completed",
      );

    return (
      roomTasks.find(
        (task) =>
          task.status ===
          "in_progress",
      ) ??
      roomTasks.find(
        (task) =>
          task.status ===
          "open",
      ) ??
      null
    );
  }


  async function handleHousekeepingStatus(
    taskId: number,
    status: HousekeepingStatus,
  ) {
    try {
      setActionId(
        taskId,
      );

      setError(null);

      await updateHousekeepingStatus(
        taskId,
        status,
      );

      await loadDashboard();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not update housekeeping task.",
        );
      }
    } finally {
      setActionId(
        null,
      );
    }
  }


  async function handleMaintenanceStatus(
    issueId: number,
    status: MaintenanceStatus,
  ) {
    try {
      setActionId(
        issueId,
      );

      setError(null);

      await updateMaintenanceStatus(
        issueId,
        status,
      );

      await loadDashboard();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not update maintenance issue.",
        );
      }
    } finally {
      setActionId(
        null,
      );
    }
  }


  async function handleCreateHousekeeping() {
    if (
      !housekeepingTitle.trim()
    ) {
      setError(
        "Housekeeping title is required.",
      );

      return;
    }

    try {
      setSavingHousekeeping(
        true,
      );

      setError(null);

      await createHousekeepingTask(
        {
          cottage_id:
            housekeepingCottage
              ? Number(
                  housekeepingCottage,
                )
              : null,

          room_id:
            housekeepingRoom
              ? Number(
                  housekeepingRoom,
                )
              : null,

          title:
            housekeepingTitle.trim(),

          description:
            housekeepingDescription.trim() ||
            null,

          priority:
            housekeepingPriority,

          assigned_to:
            housekeepingAssignedTo.trim() ||
            null,

          due_at:
            housekeepingDueAt
              ? new Date(
                  housekeepingDueAt,
                ).toISOString()
              : null,
        },
      );

      setHousekeepingCottage("");
      setHousekeepingRoom("");
      setHousekeepingTitle("");
      setHousekeepingDescription("");

      setHousekeepingPriority(
        "normal",
      );

      setHousekeepingAssignedTo("");
      setHousekeepingDueAt("");

      setShowHousekeepingForm(
        false,
      );

      await loadDashboard();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not create housekeeping task.",
        );
      }
    } finally {
      setSavingHousekeeping(
        false,
      );
    }
  }


  async function handleCreateMaintenance() {
    if (
      !maintenanceTitle.trim()
    ) {
      setError(
        "Maintenance title is required.",
      );

      return;
    }

    try {
      setSavingMaintenance(
        true,
      );

      setError(null);

      await createMaintenanceIssue(
        {
          cottage_id:
            maintenanceCottage
              ? Number(
                  maintenanceCottage,
                )
              : null,

          location:
            maintenanceLocation.trim() ||
            null,

          title:
            maintenanceTitle.trim(),

          description:
            maintenanceDescription.trim() ||
            null,

          priority:
            maintenancePriority,

          reported_by:
            maintenanceReportedBy.trim() ||
            null,
        },
      );

      setMaintenanceCottage("");
      setMaintenanceLocation("");
      setMaintenanceTitle("");
      setMaintenanceDescription("");

      setMaintenancePriority(
        "normal",
      );

      setMaintenanceReportedBy("");

      setShowMaintenanceForm(
        false,
      );

      await loadDashboard();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not create maintenance issue.",
        );
      }
    } finally {
      setSavingMaintenance(
        false,
      );
    }
  }


  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">
          Loading staff operations...
        </p>
      </section>
    );
  }


  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Open housekeeping
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {openHousekeepingCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Waiting to be started
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Cleaning in progress
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {cleaningTaskCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Active housekeeping work
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Maintenance attention
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {openMaintenanceCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Open or in progress
          </p>
        </div>
      </section>


      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "housekeeping",
                )
              }
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                viewMode ===
                "housekeeping"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Housekeeping
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "maintenance",
                )
              }
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                viewMode ===
                "maintenance"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Maintenance
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </section>


      {viewMode ===
        "housekeeping" && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                  Room turnover
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Room readiness
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  See which rooms are
                  ready for guests, need
                  cleaning, or are
                  currently being cleaned.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHousekeepingForm(
                    !showHousekeepingForm,
                  )
                }
                className="rounded-2xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                {showHousekeepingForm
                  ? "Close"
                  : "New housekeeping task"}
              </button>
            </div>


            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  Ready
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-950">
                  {readyRooms.length}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">
                  Needs cleaning
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-950">
                  {needsCleaningRooms.length}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-700">
                  Cleaning
                </p>

                <p className="mt-2 text-3xl font-bold text-sky-950">
                  {cleaningRooms.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">
                  Other status
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {otherRooms.length}
                </p>
              </div>
            </div>


            {showHousekeepingForm && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-950">
                  Create housekeeping task
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Cottage
                    </span>

                    <select
                      value={
                        housekeepingCottage
                      }
                      onChange={(
                        event,
                      ) => {
                        setHousekeepingCottage(
                          event.target.value,
                        );

                        setHousekeepingRoom(
                          "",
                        );
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    >
                      <option value="">
                        General resort
                      </option>

                      {cottages.map(
                        (cottage) => (
                          <option
                            key={
                              cottage.id
                            }
                            value={
                              cottage.id
                            }
                          >
                            {
                              cottage.name
                            }{" "}
                            (
                            {
                              cottage.code
                            }
                            )
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Room
                    </span>

                    <select
                      value={
                        housekeepingRoom
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingRoom(
                          event.target.value,
                        )
                      }
                      disabled={
                        !housekeepingCottage
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-500"
                    >
                      <option value="">
                        {housekeepingCottage
                          ? "Whole cottage / no specific room"
                          : "Select a cottage first"}
                      </option>

                      {filteredHousekeepingRooms.map(
                        (room) => (
                          <option
                            key={
                              room.id
                            }
                            value={
                              room.id
                            }
                          >
                            {
                              room.name
                            }{" "}
                            (
                            {
                              room.code
                            }
                            ) —{" "}
                            {
                              roomStatusLabel(
                                room.status,
                              )
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Task title
                    </span>

                    <input
                      value={
                        housekeepingTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingTitle(
                          event.target.value,
                        )
                      }
                      placeholder="Example: Replace bed linen"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    />
                  </label>


                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Description
                    </span>

                    <textarea
                      value={
                        housekeepingDescription
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Optional details for staff"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    />
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Priority
                    </span>

                    <select
                      value={
                        housekeepingPriority
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingPriority(
                          event.target
                            .value as TaskPriority,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="normal">
                        Normal
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>
                    </select>
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Assigned to
                    </span>

                    <input
                      value={
                        housekeepingAssignedTo
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingAssignedTo(
                          event.target.value,
                        )
                      }
                      placeholder="Optional staff name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    />
                  </label>


                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Due
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        housekeepingDueAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setHousekeepingDueAt(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-500"
                    />
                  </label>
                </div>


                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      savingHousekeeping
                    }
                    onClick={() =>
                      void handleCreateHousekeeping()
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingHousekeeping
                      ? "Saving..."
                      : "Create task"}
                  </button>
                </div>
              </div>
            )}
          </section>


          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Turnover board
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Live readiness for the
                resort&apos;s active rooms.
              </p>
            </div>


            <div className="mt-6 space-y-5">
              {cottages.map(
                (cottage) => {
                  const cottageRooms =
                    activeRooms.filter(
                      (room) =>
                        room.cottage_id ===
                        cottage.id,
                    );

                  if (
                    cottageRooms.length ===
                    0
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={
                        cottage.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {
                              cottage.name
                            }
                          </h3>

                          <p className="text-xs font-medium text-slate-500">
                            {
                              cottage.code
                            }
                          </p>
                        </div>

                        <span className="text-xs font-medium text-slate-500">
                          {
                            cottageRooms.filter(
                              (room) =>
                                room.status ===
                                "available",
                            ).length
                          }
                          /
                          {
                            cottageRooms.length
                          }{" "}
                          ready
                        </span>
                      </div>


                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {cottageRooms.map(
                          (room) => {
                            const task =
                              getActiveTaskForRoom(
                                room.id,
                              );

                            return (
                              <div
                                key={
                                  room.id
                                }
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-950">
                                      {
                                        room.name
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                      {
                                        room.code
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roomStatusClasses(
                                      room.status,
                                    )}`}
                                  >
                                    {
                                      roomStatusLabel(
                                        room.status,
                                      )
                                    }
                                  </span>
                                </div>


                                {task && (
                                  <div className="mt-3 rounded-xl bg-white p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Active task
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                      {
                                        task.title
                                      }
                                    </p>

                                    {task.assigned_to && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Assigned to{" "}
                                        {
                                          task.assigned_to
                                        }
                                      </p>
                                    )}
                                  </div>
                                )}


                                {room.status ===
                                  "needs_cleaning" && (
                                  <div className="mt-3">
                                    {task ? (
                                      <button
                                        type="button"
                                        disabled={
                                          actionId ===
                                          task.id
                                        }
                                        onClick={() =>
                                          void handleHousekeepingStatus(
                                            task.id,
                                            "in_progress",
                                          )
                                        }
                                        className="w-full rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Start cleaning
                                      </button>
                                    ) : (
                                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                        Room needs
                                        cleaning but
                                        has no active
                                        housekeeping
                                        task.
                                      </p>
                                    )}
                                  </div>
                                )}


                                {room.status ===
                                  "cleaning" && (
                                  <div className="mt-3">
                                    {task ? (
                                      <button
                                        type="button"
                                        disabled={
                                          actionId ===
                                          task.id
                                        }
                                        onClick={() =>
                                          void handleHousekeepingStatus(
                                            task.id,
                                            "completed",
                                          )
                                        }
                                        className="w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Mark room ready
                                      </button>
                                    ) : (
                                      <p className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-xs text-sky-800">
                                        Room is marked
                                        cleaning but
                                        has no active
                                        task.
                                      </p>
                                    )}
                                  </div>
                                )}


                                {room.status ===
                                  "available" && (
                                  <p className="mt-3 text-xs font-medium text-emerald-700">
                                    Ready for guests
                                  </p>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>


          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Housekeeping tasks
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                All current and completed
                housekeeping work.
              </p>
            </div>


            <div className="mt-5 space-y-3">
              {housekeepingTasks.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No housekeeping tasks.
                  </p>
                </div>
              ) : (
                housekeepingTasks.map(
                  (task) => (
                    <article
                      key={
                        task.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                            {
                              housekeepingLocation(
                                task,
                              )
                            }
                          </p>

                          <h3 className="mt-1 font-semibold text-slate-950">
                            {
                              task.title
                            }
                          </h3>

                          {task.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {
                                task.description
                              }
                            </p>
                          )}
                        </div>


                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                              task.priority,
                            )}`}
                          >
                            {
                              task.priority
                            }
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${housekeepingStatusClasses(
                              task.status,
                            )}`}
                          >
                            {task.status ===
                            "in_progress"
                              ? "In progress"
                              : task.status}
                          </span>
                        </div>
                      </div>


                      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                        <p>
                          Assigned:{" "}
                          <span className="font-medium text-slate-700">
                            {task.assigned_to ??
                              "Unassigned"}
                          </span>
                        </p>

                        <p>
                          Due:{" "}
                          <span className="font-medium text-slate-700">
                            {
                              formatDateTime(
                                task.due_at,
                              )
                            }
                          </span>
                        </p>

                        <p>
                          Created:{" "}
                          <span className="font-medium text-slate-700">
                            {
                              formatDateTime(
                                task.created_at,
                              )
                            }
                          </span>
                        </p>
                      </div>


                      <div className="mt-4 flex flex-wrap gap-2">
                        {task.status ===
                          "open" && (
                          <>
                            <button
                              type="button"
                              disabled={
                                actionId ===
                                task.id
                              }
                              onClick={() =>
                                void handleHousekeepingStatus(
                                  task.id,
                                  "in_progress",
                                )
                              }
                              className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
                            >
                              Start cleaning
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionId ===
                                task.id
                              }
                              onClick={() =>
                                void handleHousekeepingStatus(
                                  task.id,
                                  "completed",
                                )
                              }
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              Mark completed
                            </button>
                          </>
                        )}


                        {task.status ===
                          "in_progress" && (
                          <>
                            <button
                              type="button"
                              disabled={
                                actionId ===
                                task.id
                              }
                              onClick={() =>
                                void handleHousekeepingStatus(
                                  task.id,
                                  "open",
                                )
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Move back to open
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionId ===
                                task.id
                              }
                              onClick={() =>
                                void handleHousekeepingStatus(
                                  task.id,
                                  "completed",
                                )
                              }
                              className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                            >
                              Mark completed
                            </button>
                          </>
                        )}


                        {task.status ===
                          "completed" && (
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              task.id
                            }
                            onClick={() =>
                              void handleHousekeepingStatus(
                                task.id,
                                "open",
                              )
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </article>
                  ),
                )
              )}
            </div>
          </section>
        </>
      )}


      {viewMode ===
        "maintenance" && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
                  Resort upkeep
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Maintenance
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Report and track
                  maintenance issues around
                  cottages and shared resort
                  areas.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMaintenanceForm(
                    !showMaintenanceForm,
                  )
                }
                className="rounded-2xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                {showMaintenanceForm
                  ? "Close"
                  : "Report issue"}
              </button>
            </div>


            {showMaintenanceForm && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-950">
                  Report maintenance issue
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Cottage
                    </span>

                    <select
                      value={
                        maintenanceCottage
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenanceCottage(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    >
                      <option value="">
                        General resort
                      </option>

                      {cottages.map(
                        (cottage) => (
                          <option
                            key={
                              cottage.id
                            }
                            value={
                              cottage.id
                            }
                          >
                            {
                              cottage.name
                            }{" "}
                            (
                            {
                              cottage.code
                            }
                            )
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Location
                    </span>

                    <input
                      value={
                        maintenanceLocation
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenanceLocation(
                          event.target.value,
                        )
                      }
                      placeholder="Example: Front door"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    />
                  </label>


                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Issue
                    </span>

                    <input
                      value={
                        maintenanceTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenanceTitle(
                          event.target.value,
                        )
                      }
                      placeholder="Example: Aircon not cooling"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    />
                  </label>


                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Description
                    </span>

                    <textarea
                      value={
                        maintenanceDescription
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenanceDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Describe the problem"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    />
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Priority
                    </span>

                    <select
                      value={
                        maintenancePriority
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenancePriority(
                          event.target
                            .value as TaskPriority,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="normal">
                        Normal
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>
                    </select>
                  </label>


                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Reported by
                    </span>

                    <input
                      value={
                        maintenanceReportedBy
                      }
                      onChange={(
                        event,
                      ) =>
                        setMaintenanceReportedBy(
                          event.target.value,
                        )
                      }
                      placeholder="Optional staff name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-violet-500"
                    />
                  </label>
                </div>


                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      savingMaintenance
                    }
                    onClick={() =>
                      void handleCreateMaintenance()
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingMaintenance
                      ? "Saving..."
                      : "Report issue"}
                  </button>
                </div>
              </div>
            )}
          </section>


          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Maintenance issues
            </h2>

            <div className="mt-5 space-y-3">
              {maintenanceIssues.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No maintenance issues.
                  </p>
                </div>
              ) : (
                maintenanceIssues.map(
                  (issue) => (
                    <article
                      key={
                        issue.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                            {issue.cottage_name ??
                              "General resort"}

                            {issue.location
                              ? ` · ${issue.location}`
                              : ""}
                          </p>

                          <h3 className="mt-1 font-semibold text-slate-950">
                            {
                              issue.title
                            }
                          </h3>

                          {issue.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {
                                issue.description
                              }
                            </p>
                          )}
                        </div>


                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                              issue.priority,
                            )}`}
                          >
                            {
                              issue.priority
                            }
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${maintenanceStatusClasses(
                              issue.status,
                            )}`}
                          >
                            {issue.status ===
                            "in_progress"
                              ? "In progress"
                              : issue.status}
                          </span>
                        </div>
                      </div>


                      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                        <p>
                          Reported by:{" "}
                          <span className="font-medium text-slate-700">
                            {issue.reported_by ??
                              "Not set"}
                          </span>
                        </p>

                        <p>
                          Created:{" "}
                          <span className="font-medium text-slate-700">
                            {
                              formatDateTime(
                                issue.created_at,
                              )
                            }
                          </span>
                        </p>

                        <p>
                          Resolved:{" "}
                          <span className="font-medium text-slate-700">
                            {
                              formatDateTime(
                                issue.resolved_at,
                              )
                            }
                          </span>
                        </p>
                      </div>


                      <div className="mt-4 flex flex-wrap gap-2">
                        {issue.status ===
                          "open" && (
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              issue.id
                            }
                            onClick={() =>
                              void handleMaintenanceStatus(
                                issue.id,
                                "in_progress",
                              )
                            }
                            className="rounded-xl bg-violet-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-50"
                          >
                            Start work
                          </button>
                        )}


                        {issue.status ===
                          "in_progress" && (
                          <>
                            <button
                              type="button"
                              disabled={
                                actionId ===
                                issue.id
                              }
                              onClick={() =>
                                void handleMaintenanceStatus(
                                  issue.id,
                                  "open",
                                )
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Reopen
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionId ===
                                issue.id
                              }
                              onClick={() =>
                                void handleMaintenanceStatus(
                                  issue.id,
                                  "resolved",
                                )
                              }
                              className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                            >
                              Mark resolved
                            </button>
                          </>
                        )}


                        {issue.status ===
                          "open" && (
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              issue.id
                            }
                            onClick={() =>
                              void handleMaintenanceStatus(
                                issue.id,
                                "resolved",
                              )
                            }
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Mark resolved
                          </button>
                        )}


                        {issue.status ===
                          "resolved" && (
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              issue.id
                            }
                            onClick={() =>
                              void handleMaintenanceStatus(
                                issue.id,
                                "open",
                              )
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </article>
                  ),
                )
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}