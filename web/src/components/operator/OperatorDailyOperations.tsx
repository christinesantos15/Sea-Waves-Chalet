"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  checkInReservation,
  checkOutReservation,
  getOperatorDailyOperations,
  type OperatorDailyOperations as DailyOperationsData,
  type OperatorReservation,
} from "@/lib/operatorApi";

function getLocalDateString() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}

function formatStayDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}

type ReservationCardProps = {
  reservation: OperatorReservation;

  actionLabel?: string;

  actionPending?: boolean;

  onAction?: () => void;
};

function ReservationCard({
  reservation,
  actionLabel,
  actionPending = false,
  onAction,
}: ReservationCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold text-slate-500">
            {reservation.reference}
          </p>

          <h4 className="mt-2 text-lg font-semibold text-slate-950">
            {reservation.guest_name}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {reservation.guest_count}{" "}
            {reservation.guest_count === 1
              ? "guest"
              : "guests"}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
          {reservation.status.replace(
            "_",
            " ",
          )}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Accommodation
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {reservation.cottage_name}
          </p>

          <p className="text-xs text-slate-500">
            {reservation.room_name ??
              "Whole cottage"}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Stay
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatStayDate(
              reservation.check_in,
            )}
          </p>

          <p className="text-xs text-slate-500">
            to{" "}
            {formatStayDate(
              reservation.check_out,
            )}
          </p>
        </div>

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
            Amount
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {Number(
              reservation.total_amount,
            ) === 0
              ? "To be set"
              : new Intl.NumberFormat(
                  "en-PH",
                  {
                    style:
                      "currency",
                    currency:
                      "PHP",
                  },
                ).format(
                  Number(
                    reservation.total_amount,
                  ),
                )}
          </p>
        </div>
      </div>

      {reservation.notes && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Notes
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {reservation.notes}
          </p>
        </div>
      )}

      {actionLabel &&
        onAction && (
          <button
            type="button"
            disabled={
              actionPending
            }
            onClick={
              onAction
            }
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionPending
              ? "Updating..."
              : actionLabel}
          </button>
        )}
    </article>
  );
}

export default function OperatorDailyOperations() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDateString,
  );

  const [
    data,
    setData,
  ] =
    useState<DailyOperationsData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    actionReservationId,
    setActionReservationId,
  ] = useState<
    number | null
  >(null);

  const loadOperations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getOperatorDailyOperations(
            selectedDate,
          );

        setData(result);
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            "Could not load daily operations.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, [selectedDate]);

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  async function handleCheckIn(
    reservationId: number,
  ) {
    try {
      setActionReservationId(
        reservationId,
      );

      setError(null);

      await checkInReservation(
        reservationId,
      );

      await loadOperations();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not check in guest.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }

  async function handleCheckOut(
    reservationId: number,
  ) {
    try {
      setActionReservationId(
        reservationId,
      );

      setError(null);

      await checkOutReservation(
        reservationId,
      );

      await loadOperations();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not check out guest.",
        );
      }
    } finally {
      setActionReservationId(
        null,
      );
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Daily Operations
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Today at Sea Waves
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Arrivals, current
            guests and departures
            for the selected day.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label>
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Operations date
            </span>

            <input
              type="date"
              value={
                selectedDate
              }
              onChange={(
                event,
              ) =>
                setSelectedDate(
                  event.target
                    .value,
                )
              }
              className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setSelectedDate(
                getLocalDateString(),
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Today
          </button>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={() =>
              void loadOperations()
            }
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">
          {formatDisplayDate(
            selectedDate,
          )}
        </p>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">
            Arriving
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {data?.counts
              .arrivals ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Confirmed arrivals
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-800">
            Currently staying
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {data?.counts
              .staying ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Guests checked in
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-sm font-medium text-violet-800">
            Departing
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {data?.counts
              .departures ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Checkouts due
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            Loading daily
            operations...
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Arrivals
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  Arriving on this
                  day
                </h3>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {data?.arrivals
                  .length ?? 0}
              </span>
            </div>

            {!data ||
            data.arrivals
              .length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No confirmed
                  arrivals for this
                  date.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {data.arrivals.map(
                  (
                    reservation,
                  ) => (
                    <ReservationCard
                      key={
                        reservation.id
                      }
                      reservation={
                        reservation
                      }
                      actionLabel="Check in guest"
                      actionPending={
                        actionReservationId ===
                        reservation.id
                      }
                      onAction={() =>
                        void handleCheckIn(
                          reservation.id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  In House
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  Currently staying
                </h3>
              </div>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                {data?.staying
                  .length ?? 0}
              </span>
            </div>

            {!data ||
            data.staying
              .length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No checked-in
                  guests for this
                  date.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {data.staying.map(
                  (
                    reservation,
                  ) => (
                    <ReservationCard
                      key={
                        reservation.id
                      }
                      reservation={
                        reservation
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                  Departures
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  Departing on this
                  day
                </h3>
              </div>

              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                {data?.departures
                  .length ?? 0}
              </span>
            </div>

            {!data ||
            data.departures
              .length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No checked-in
                  departures for
                  this date.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {data.departures.map(
                  (
                    reservation,
                  ) => (
                    <ReservationCard
                      key={
                        reservation.id
                      }
                      reservation={
                        reservation
                      }
                      actionLabel="Check out guest"
                      actionPending={
                        actionReservationId ===
                        reservation.id
                      }
                      onAction={() =>
                        void handleCheckOut(
                          reservation.id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}