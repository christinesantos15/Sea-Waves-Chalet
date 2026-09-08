"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getOwnerDashboard,
  type OwnerDashboardData,
} from "@/lib/ownerApi";


function philippinesToday() {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}


function formatMoney(
  value: string,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return "₱0.00";
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    },
  ).format(
    amount,
  );
}


function formatDate(
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


function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Not recorded";
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


function statusLabel(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function statusClasses(
  value: string,
) {
  switch (value) {
    case "pending":
      return (
        "bg-amber-100 " +
        "text-amber-700"
      );

    case "confirmed":
      return (
        "bg-emerald-100 " +
        "text-emerald-700"
      );

    case "checked_in":
      return (
        "bg-sky-100 " +
        "text-sky-700"
      );

    case "checked_out":
      return (
        "bg-violet-100 " +
        "text-violet-700"
      );

    default:
      return (
        "bg-slate-100 " +
        "text-slate-700"
      );
  }
}


type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
};


function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}


export default function OwnerDashboard() {
  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    philippinesToday(),
  );

  const [
    dashboard,
    setDashboard,
  ] = useState<
    OwnerDashboardData | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const loadDashboard =
    useCallback(
      async (
        date: string,
      ) => {
        try {
          setLoading(true);
          setError(null);

          const result =
            await getOwnerDashboard(
              date,
            );

          setDashboard(
            result,
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
              "Could not load owner dashboard.",
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadDashboard(
      selectedDate,
    );
  }, [
    loadDashboard,
    selectedDate,
  ]);


  if (
    loading &&
    dashboard === null
  ) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600">
          Loading resort overview...
        </p>
      </section>
    );
  }


  if (!dashboard) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          {error ??
            "Owner dashboard is unavailable."}
        </p>
      </section>
    );
  }


  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Resort overview for
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatDate(
                dashboard.date,
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
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
                    event.target.value,
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                setSelectedDate(
                  philippinesToday(),
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadDashboard(
                  selectedDate,
                )
              }
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>
      </section>


      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
            Today
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Resort activity
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Arrivals"
            value={
              dashboard.today.arrivals
            }
          />

          <MetricCard
            label="Guests staying"
            value={
              dashboard.today.staying
            }
          />

          <MetricCard
            label="Departures"
            value={
              dashboard.today.departures
            }
          />
        </div>
      </section>


      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
            Bookings
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Reservation overview
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Pending requests
              </span>

              <strong>
                {
                  dashboard.bookings
                    .pending
                }
              </strong>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Confirmed
              </span>

              <strong>
                {
                  dashboard.bookings
                    .confirmed
                }
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-slate-600">
                Checked in
              </span>

              <strong>
                {
                  dashboard.bookings
                    .checked_in
                }
              </strong>
            </div>
          </div>
        </div>


        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Finance
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Booking value
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Booked value
              </span>

              <strong>
                {formatMoney(
                  dashboard.finance
                    .booked_value,
                )}
              </strong>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">
                Payments received
              </span>

              <strong className="text-emerald-700">
                {formatMoney(
                  dashboard.finance
                    .payments_received,
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-slate-600">
                Outstanding
              </span>

              <strong className="text-amber-700">
                {formatMoney(
                  dashboard.finance
                    .outstanding_balance,
                )}
              </strong>
            </div>
          </div>
        </div>
      </section>


      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">
            Rooms
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Room readiness
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Ready"
            value={
              dashboard.rooms.ready
            }
          />

          <MetricCard
            label="Needs cleaning"
            value={
              dashboard.rooms
                .needs_cleaning
            }
          />

          <MetricCard
            label="Cleaning"
            value={
              dashboard.rooms.cleaning
            }
          />

          <MetricCard
            label="Occupied"
            value={
              dashboard.rooms.occupied
            }
          />

          <MetricCard
            label="Occupancy"
            value={
              `${dashboard.rooms.occupancy_percent}%`
            }
            description={
              `${dashboard.rooms.total} active rooms`
            }
          />
        </div>
      </section>


      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          Attention
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Things that may need action
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Pending reservations"
            value={
              dashboard.attention
                .pending_reservations
            }
          />

          <MetricCard
            label="Payment attention"
            value={
              dashboard.attention
                .payment_attention
            }
          />

          <MetricCard
            label="Rooms needing attention"
            value={
              dashboard.attention
                .rooms_needing_attention
            }
          />

          <MetricCard
            label="Open maintenance"
            value={
              dashboard.attention
                .open_maintenance
            }
          />
        </div>
      </section>


      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Recent bookings
          </h2>

          <div className="mt-5 space-y-3">
            {dashboard.recent_reservations.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No reservations yet.
              </p>
            ) : (
              dashboard.recent_reservations.map(
                (reservation) => (
                  <article
                    key={
                      reservation.id
                    }
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {
                            reservation.guest_name
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            reservation.reference
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                          reservation.status,
                        )}`}
                      >
                        {statusLabel(
                          reservation.status,
                        )}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      {
                        reservation.cottage_name
                      }

                      {reservation.room_name
                        ? ` · ${reservation.room_name}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(
                        reservation.check_in,
                      )}
                      {" → "}
                      {formatDate(
                        reservation.check_out,
                      )}
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {formatMoney(
                        reservation.total_amount,
                      )}
                    </p>
                  </article>
                ),
              )
            )}
          </div>
        </div>


        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Recent payments
          </h2>

          <div className="mt-5 space-y-3">
            {dashboard.recent_payments.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No received payments yet.
              </p>
            ) : (
              dashboard.recent_payments.map(
                (payment) => (
                  <article
                    key={
                      payment.id
                    }
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {
                            payment.guest_name
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            payment.reservation_reference
                          }
                        </p>
                      </div>

                      <p className="font-bold text-emerald-700">
                        {formatMoney(
                          payment.amount,
                        )}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      {statusLabel(
                        payment.payment_type,
                      )}

                      {payment.payment_method
                        ? ` · ${payment.payment_method}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        payment.paid_at ??
                          payment.created_at,
                      )}
                    </p>
                  </article>
                ),
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}