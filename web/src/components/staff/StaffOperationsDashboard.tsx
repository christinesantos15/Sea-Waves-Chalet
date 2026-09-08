"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createHousekeepingTask,
  createMaintenanceIssue,
  getCottageOptions,
  getHousekeepingTasks,
  getMaintenanceIssues,
  updateHousekeepingStatus,
  updateMaintenanceStatus,
  type CottageOption,
  type HousekeepingStatus,
  type HousekeepingTask,
  type MaintenanceIssue,
  type MaintenanceStatus,
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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    actionId,
    setActionId,
  ] = useState<
    number | null
  >(null);

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

        setHousekeepingTasks(
          housekeeping,
        );

        setMaintenanceIssues(
          maintenance,
        );

        setCottages(
          cottageOptions,
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

  const housekeepingCounts = {
    open:
      housekeepingTasks.filter(
        (task) =>
          task.status === "open",
      ).length,

    inProgress:
      housekeepingTasks.filter(
        (task) =>
          task.status ===
          "in_progress",
      ).length,

    completed:
      housekeepingTasks.filter(
        (task) =>
          task.status ===
          "completed",
      ).length,
  };

  const maintenanceCounts = {
    open:
      maintenanceIssues.filter(
        (issue) =>
          issue.status === "open",
      ).length,

    inProgress:
      maintenanceIssues.filter(
        (issue) =>
          issue.status ===
          "in_progress",
      ).length,

    resolved:
      maintenanceIssues.filter(
        (issue) =>
          issue.status ===
          "resolved",
      ).length,
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">
            Open housekeeping
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {
              housekeepingCounts.open
            }
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-800">
            Cleaning in progress
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {
              housekeepingCounts.inProgress
            }
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-800">
            Open maintenance
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {
              maintenanceCounts.open
            }
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            setViewMode(
              "housekeeping",
            )
          }
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            viewMode ===
            "housekeeping"
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            viewMode ===
            "maintenance"
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Maintenance
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void loadDashboard()
          }
          className="ml-auto rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {viewMode ===
        "housekeeping" && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Housekeeping
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Cleaning tasks
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowHousekeepingForm(
                  (value) =>
                    !value,
                )
              }
              className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              New housekeeping task
            </button>
          </div>

          {showHousekeepingForm && (
            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Cottage
                  </span>

                  <select
                    value={
                      housekeepingCottage
                    }
                    onChange={(
                      event,
                    ) =>
                      setHousekeepingCottage(
                        event.target
                          .value,
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      General resort task
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
                            cottage.code
                          }{" "}
                          —{" "}
                          {
                            cottage.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
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
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Task
                </span>

                <input
                  type="text"
                  value={
                    housekeepingTitle
                  }
                  onChange={(
                    event,
                  ) =>
                    setHousekeepingTitle(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Clean cottage after checkout"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>

                <textarea
                  rows={3}
                  value={
                    housekeepingDescription
                  }
                  onChange={(
                    event,
                  ) =>
                    setHousekeepingDescription(
                      event.target
                        .value,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Assigned to
                  </span>

                  <input
                    type="text"
                    value={
                      housekeepingAssignedTo
                    }
                    onChange={(
                      event,
                    ) =>
                      setHousekeepingAssignedTo(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Staff name"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                </label>

                <label>
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
                        event.target
                          .value,
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  disabled={
                    savingHousekeeping
                  }
                  onClick={() =>
                    void handleCreateHousekeeping()
                  }
                  className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingHousekeeping
                    ? "Saving..."
                    : "Create task"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowHousekeepingForm(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {housekeepingTasks.map(
              (task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        HOUSEKEEPING #
                        {task.id}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {task.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {task.cottage_name ??
                          "General resort"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses(
                          task.priority,
                        )}`}
                      >
                        {
                          task.priority
                        }
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${housekeepingStatusClasses(
                          task.status,
                        )}`}
                      >
                        {task.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {
                        task.description
                      }
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Assigned
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {task.assigned_to ??
                          "Unassigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Due
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(
                          task.due_at,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {task.status !==
                      "open" && (
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
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Reopen
                      </button>
                    )}

                    {task.status !==
                      "in_progress" && (
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
                        className="rounded-xl bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700"
                      >
                        Start cleaning
                      </button>
                    )}

                    {task.status !==
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
                            "completed",
                          )
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Mark completed
                      </button>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}

      {viewMode ===
        "maintenance" && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                Maintenance
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Maintenance issues
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowMaintenanceForm(
                  (value) =>
                    !value,
                )
              }
              className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
            >
              Report issue
            </button>
          </div>

          {showMaintenanceForm && (
            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label>
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
                        event.target
                          .value,
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      General resort issue
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
                            cottage.code
                          }{" "}
                          —{" "}
                          {
                            cottage.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
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
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Location
                </span>

                <input
                  type="text"
                  value={
                    maintenanceLocation
                  }
                  onChange={(
                    event,
                  ) =>
                    setMaintenanceLocation(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Front door, pool, event hall..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Issue
                </span>

                <input
                  type="text"
                  value={
                    maintenanceTitle
                  }
                  onChange={(
                    event,
                  ) =>
                    setMaintenanceTitle(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Broken door lock"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>

                <textarea
                  rows={3}
                  value={
                    maintenanceDescription
                  }
                  onChange={(
                    event,
                  ) =>
                    setMaintenanceDescription(
                      event.target
                        .value,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Reported by
                </span>

                <input
                  type="text"
                  value={
                    maintenanceReportedBy
                  }
                  onChange={(
                    event,
                  ) =>
                    setMaintenanceReportedBy(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Staff name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  disabled={
                    savingMaintenance
                  }
                  onClick={() =>
                    void handleCreateMaintenance()
                  }
                  className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingMaintenance
                    ? "Saving..."
                    : "Report issue"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowMaintenanceForm(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {maintenanceIssues.map(
              (issue) => (
                <article
                  key={issue.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        MAINTENANCE #
                        {issue.id}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {issue.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {issue.cottage_name ??
                          "General resort"}
                        {issue.location
                          ? ` · ${issue.location}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses(
                          issue.priority,
                        )}`}
                      >
                        {
                          issue.priority
                        }
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${maintenanceStatusClasses(
                          issue.status,
                        )}`}
                      >
                        {issue.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>
                  </div>

                  {issue.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {
                        issue.description
                      }
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Reported by
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {issue.reported_by ??
                          "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Reported
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(
                          issue.created_at,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {issue.status !==
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
                            "open",
                          )
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Reopen
                      </button>
                    )}

                    {issue.status !==
                      "in_progress" && (
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
                        className="rounded-xl bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700"
                      >
                        Start work
                      </button>
                    )}

                    {issue.status !==
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
                            "resolved",
                          )
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Mark resolved
                      </button>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}