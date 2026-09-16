"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import OperatorPaymentPanel from "@/components/operator/OperatorPaymentPanel";

import {
  assignReservationRoom,
  checkInReservation,
  checkOutReservation,
  decideReservation,
  getOperatorReservations,
  type OperatorReservation,
  type OperatorReservationStatus,
} from "@/lib/operatorApi";

import {
  getOperatorCottages,
  type OperatorCottage,
} from "@/lib/operatorCottageApi";

type QueueStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "declined";

function formatDate(
  value: string,
) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function formatCreatedAt(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function statusClasses(
  status: OperatorReservationStatus,
) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";

    case "checked_in":
      return "bg-sky-100 text-sky-800";

    case "checked_out":
      return "bg-slate-200 text-slate-700";

    case "declined":
    case "cancelled":
      return "bg-red-100 text-red-700";

    case "pending":
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function queueLabel(
  status: QueueStatus,
) {
  switch (status) {
    case "checked_in":
      return "Checked in";

    case "checked_out":
      return "Checked out";

    case "pending":
      return "Pending";

    case "confirmed":
      return "Confirmed";

    case "declined":
      return "Declined";
  }
}

export default function OperatorReservationQueue() {
  const [activeStatus, setActiveStatus] =
    useState<QueueStatus>(
      "pending",
    );

  const [
    reservations,
    setReservations,
  ] = useState<
    OperatorReservation[]
  >([]);

  const [counts, setCounts] =
    useState({
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      declined: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    actionReservationId,
    setActionReservationId,
  ] = useState<number | null>(
    null,
  );

  const [
    cottages,
    setCottages,
  ] = useState<
    OperatorCottage[]
  >([]);

  const [
    assignmentCottageIds,
    setAssignmentCottageIds,
  ] = useState<
    Record<number, string>
  >({});

  const [
    assignmentRoomIds,
    setAssignmentRoomIds,
  ] = useState<
    Record<number, string>
  >({});

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          pending,
          confirmed,
          checkedIn,
          checkedOut,
          declined,
          inventory,
        ] = await Promise.all([
          getOperatorReservations(
            "pending",
          ),
          getOperatorReservations(
            "confirmed",
          ),
          getOperatorReservations(
            "checked_in",
          ),
          getOperatorReservations(
            "checked_out",
          ),
          getOperatorReservations(
            "declined",
          ),
          getOperatorCottages(),
        ]);

        setCottages(inventory);

        setCounts({
          pending:
            pending.length,

          confirmed:
            confirmed.length,

          checked_in:
            checkedIn.length,

          checked_out:
            checkedOut.length,

          declined:
            declined.length,
        });

        const queueMap: Record<
          QueueStatus,
          OperatorReservation[]
        > = {
          pending,
          confirmed,
          checked_in:
            checkedIn,
          checked_out:
            checkedOut,
          declined,
        };

        setReservations(
          queueMap[
            activeStatus
          ],
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
            "Could not load reservations.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, [activeStatus]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleDecision(
    reservation:
      OperatorReservation,
    decision:
      | "confirmed"
      | "declined",
  ) {
    try {
      setActionReservationId(
        reservation.id,
      );

      setError(null);

      await decideReservation(
        reservation.id,
        decision,
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
          "Could not update reservation.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }

  async function handleAssignment(
    reservation:
      OperatorReservation,
  ) {
    const cottageValue =
      assignmentCottageIds[
        reservation.id
      ] ?? "";

    const roomValue =
      assignmentRoomIds[
        reservation.id
      ] ?? "";

    const cottageId =
      Number(cottageValue);

    const roomId =
      Number(roomValue);

    if (
      !Number.isInteger(cottageId) ||
      cottageId <= 0 ||
      !Number.isInteger(roomId) ||
      roomId <= 0
    ) {
      setError(
        "Choose a cottage and room before assigning.",
      );

      return;
    }

    try {
      setActionReservationId(
        reservation.id,
      );

      setError(null);

      await assignReservationRoom(
        reservation.id,
        cottageId,
        roomId,
      );

      setAssignmentCottageIds(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            reservation.id
          ];

          return next;
        },
      );

      setAssignmentRoomIds(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            reservation.id
          ];

          return next;
        },
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
          "Could not assign physical room.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }


  async function handleCheckIn(
    reservation:
      OperatorReservation,
  ) {
    try {
      setActionReservationId(
        reservation.id,
      );

      setError(null);

      await checkInReservation(
        reservation.id,
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
          "Could not check in reservation.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }

  async function handleCheckOut(
    reservation:
      OperatorReservation,
  ) {
    try {
      setActionReservationId(
        reservation.id,
      );

      setError(null);

      await checkOutReservation(
        reservation.id,
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
          "Could not check out reservation.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() =>
            setActiveStatus(
              "pending",
            )
          }
          className={`rounded-2xl border p-5 text-left transition ${
            activeStatus ===
            "pending"
              ? "border-amber-300 bg-amber-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-500">
            Pending
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {counts.pending}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Needs review
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveStatus(
              "confirmed",
            )
          }
          className={`rounded-2xl border p-5 text-left transition ${
            activeStatus ===
            "confirmed"
              ? "border-emerald-300 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-500">
            Confirmed
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {counts.confirmed}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Awaiting arrival
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveStatus(
              "checked_in",
            )
          }
          className={`rounded-2xl border p-5 text-left transition ${
            activeStatus ===
            "checked_in"
              ? "border-sky-300 bg-sky-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-500">
            Checked in
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {counts.checked_in}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Current guests
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveStatus(
              "checked_out",
            )
          }
          className={`rounded-2xl border p-5 text-left transition ${
            activeStatus ===
            "checked_out"
              ? "border-slate-400 bg-slate-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-500">
            Checked out
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {
              counts.checked_out
            }
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Completed stays
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveStatus(
              "declined",
            )
          }
          className={`rounded-2xl border p-5 text-left transition ${
            activeStatus ===
            "declined"
              ? "border-red-300 bg-red-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-500">
            Declined
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {counts.declined}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Not accepted
          </p>
        </button>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Reservations
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {queueLabel(
                activeStatus,
              )}{" "}
              reservations
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading reservations...
            </p>
          </div>
        )}

        {!loading &&
          reservations.length ===
            0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium text-slate-800">
                No{" "}
                {queueLabel(
                  activeStatus,
                ).toLowerCase()}{" "}
                reservations
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Reservations will
                appear here when
                their status matches
                this queue.
              </p>
            </div>
          )}

        {!loading &&
          reservations.length >
            0 && (
            <div className="mt-6 space-y-4">
              {reservations.map(
                (
                  reservation,
                ) => {
                  const actionPending =
                    actionReservationId ===
                    reservation.id;

                  const isRoomTypeRequest =
                    reservation.room_type_id !==
                    null;

                  const needsAssignment =
                    isRoomTypeRequest &&
                    (
                      reservation.cottage_id ===
                        null ||
                      reservation.room_id ===
                        null
                    );

                  const compatibleCottages =
                    isRoomTypeRequest
                      ? cottages.filter(
                          (cottage) =>
                            cottage.is_active &&
                            cottage.rooms.some(
                              (room) =>
                                room.is_active &&
                                room.room_type_id ===
                                  reservation.room_type_id,
                            ),
                        )
                      : [];

                  const selectedCottageId =
                    Number(
                      assignmentCottageIds[
                        reservation.id
                      ] ?? "",
                    );

                  const selectedCottage =
                    cottages.find(
                      (cottage) =>
                        cottage.id ===
                        selectedCottageId,
                    );

                  const compatibleRooms =
                    selectedCottage
                      ? selectedCottage.rooms.filter(
                          (room) =>
                            room.is_active &&
                            room.room_type_id ===
                              reservation.room_type_id,
                        )
                      : [];

                  return (
                    <article
                      key={
                        reservation.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-mono text-sm font-semibold text-slate-700">
                              {
                                reservation.reference
                              }
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(
                                reservation.status,
                              )}`}
                            >
                              {reservation.status.replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-semibold text-slate-950">
                            {
                              reservation.guest_name
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Received{" "}
                            {formatCreatedAt(
                              reservation.created_at,
                            )}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {
                            reservation.source
                          }
                        </span>
                      </div>

                      <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Accommodation
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {reservation.room_type_id !==
                            null
                              ? reservation.room_type_name ??
                                "Room type request"
                              : reservation.cottage_name ??
                                "Not assigned"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {reservation.room_type_id !==
                            null
                              ? reservation.cottage_name &&
                                reservation.room_name
                                ? `${reservation.cottage_name} · ${reservation.room_name}`
                                : "Physical room not assigned yet"
                              : reservation.room_name ??
                                "Whole cottage"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Stay
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(
                              reservation.check_in,
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            to{" "}
                            {formatDate(
                              reservation.check_out,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Guests
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {
                              reservation.guest_count
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {Number(
                              reservation.total_amount,
                            ) === 0
                              ? "To be set"
                              : `₱${Number(
                                  reservation.total_amount,
                                ).toLocaleString(
                                  "en-PH",
                                )}`}
                          </p>
                        </div>
                      </div>

                      {reservation.room_type_id !==
                        null && (
                        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Requested accommodation
                          </p>

                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-slate-500">
                                Room type
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {reservation.room_type_name ??
                                  "Unknown room type"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Rate plan
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {reservation.rate_plan ===
                                "with_breakfast"
                                  ? "With breakfast"
                                  : reservation.rate_plan ===
                                      "without_breakfast"
                                    ? "Without breakfast"
                                    : "Not set"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Quoted nightly rate
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {reservation.quoted_rate !==
                                null
                                  ? `₱${Number(
                                      reservation.quoted_rate,
                                    ).toLocaleString(
                                      "en-PH",
                                    )}`
                                  : "Not set"}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-xs text-slate-500">
                            This displays the rate
                            captured when the guest
                            submitted the request.
                          </p>
                        </div>
                      )}

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Phone
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {reservation.guest_phone ??
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Email
                          </p>

                          <p className="mt-1 break-all text-sm text-slate-700">
                            {reservation.guest_email ??
                              "Not provided"}
                          </p>
                        </div>
                      </div>

                      {reservation.notes && (
                        <div className="mt-5 rounded-xl border border-slate-100 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {
                              reservation.notes
                            }
                          </p>
                        </div>
                      )}

                      {reservation.status ===
                        "pending" &&
                        needsAssignment && (
                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                              Physical assignment required
                            </p>

                            <p className="mt-2 text-sm text-amber-900">
                              Assign a physical room
                              that matches the requested
                              room type before confirming
                              this reservation.
                            </p>
                          </div>

                          {compatibleCottages.length ===
                          0 ? (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                              <p className="text-sm font-medium text-slate-800">
                                No matching physical rooms
                                are mapped yet.
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Assign this room type to
                                a physical room under
                                Cottages first.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                              <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                  Cottage
                                </span>

                                <select
                                  value={
                                    assignmentCottageIds[
                                      reservation.id
                                    ] ?? ""
                                  }
                                  onChange={(event) => {
                                    const value =
                                      event.target.value;

                                    setAssignmentCottageIds(
                                      (current) => ({
                                        ...current,
                                        [reservation.id]:
                                          value,
                                      }),
                                    );

                                    setAssignmentRoomIds(
                                      (current) => ({
                                        ...current,
                                        [reservation.id]:
                                          "",
                                      }),
                                    );
                                  }}
                                  disabled={
                                    actionPending
                                  }
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                                >
                                  <option value="">
                                    Select cottage
                                  </option>

                                  {compatibleCottages.map(
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
                                        ·{" "}
                                        {
                                          cottage.name
                                        }
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>

                              <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                  Room
                                </span>

                                <select
                                  value={
                                    assignmentRoomIds[
                                      reservation.id
                                    ] ?? ""
                                  }
                                  onChange={(event) =>
                                    setAssignmentRoomIds(
                                      (current) => ({
                                        ...current,
                                        [reservation.id]:
                                          event.target
                                            .value,
                                      }),
                                    )
                                  }
                                  disabled={
                                    actionPending ||
                                    !selectedCottage
                                  }
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 disabled:bg-slate-100"
                                >
                                  <option value="">
                                    Select room
                                  </option>

                                  {compatibleRooms.map(
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
                                          room.code
                                        }{" "}
                                        ·{" "}
                                        {
                                          room.name
                                        }
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>

                              <button
                                type="button"
                                disabled={
                                  actionPending ||
                                  !assignmentCottageIds[
                                    reservation.id
                                  ] ||
                                  !assignmentRoomIds[
                                    reservation.id
                                  ]
                                }
                                onClick={() =>
                                  void handleAssignment(
                                    reservation,
                                  )
                                }
                                className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {actionPending
                                  ? "Assigning..."
                                  : "Assign room"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {reservation.status ===
                        "pending" &&
                        isRoomTypeRequest &&
                        !needsAssignment && (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-sm font-semibold text-emerald-800">
                            Physical room assigned
                          </p>

                          <p className="mt-1 text-sm text-emerald-700">
                            {reservation.cottage_code} ·{" "}
                            {reservation.room_code} —{" "}
                            {reservation.room_name}
                          </p>
                        </div>
                      )}

                      {reservation.status ===
                        "pending" && (
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            disabled={
                              actionPending ||
                              needsAssignment
                            }
                            onClick={() =>
                              void handleDecision(
                                reservation,
                                "confirmed",
                              )
                            }
                            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionPending
                              ? "Updating..."
                              : "Confirm reservation"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionPending
                            }
                            onClick={() =>
                              void handleDecision(
                                reservation,
                                "declined",
                              )
                            }
                            className="flex-1 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {reservation.status ===
                        "confirmed" && (
                        <>
                          <div className="mt-6">
                            <button
                              type="button"
                              disabled={
                                actionPending
                              }
                              onClick={() =>
                                void handleCheckIn(
                                  reservation,
                                )
                              }
                              className="w-full rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionPending
                                ? "Checking in..."
                                : "Check in guest"}
                            </button>
                          </div>

                          <OperatorPaymentPanel
                            reservationId={
                              reservation.id
                            }
                          />
                        </>
                      )}

                      {reservation.status ===
                        "checked_in" && (
                        <>
                          <div className="mt-6">
                            <button
                              type="button"
                              disabled={
                                actionPending
                              }
                              onClick={() =>
                                void handleCheckOut(
                                  reservation,
                                )
                              }
                              className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionPending
                                ? "Checking out..."
                                : "Check out guest"}
                            </button>
                          </div>

                          <OperatorPaymentPanel
                            reservationId={
                              reservation.id
                            }
                          />
                        </>
                      )}

                      {reservation.status ===
                        "checked_out" && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-700">
                            Stay completed
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            This guest has
                            been checked out
                            and the room has
                            been released.
                          </p>
                        </div>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          )}
      </section>
    </div>
  );
}