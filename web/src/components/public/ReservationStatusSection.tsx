"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  lookupReservationStatus,
  type ReservationStatusLookupResponse,
} from "@/lib/clientResortApi";


function peso(
  value: string | number,
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}


function statusLabel(
  status: string,
): string {
  switch (status) {
    case "pending":
      return "Pending review";

    case "confirmed":
      return "Confirmed";

    case "cancelled":
      return "Cancelled";

    case "checked_in":
      return "Checked in";

    case "checked_out":
      return "Checked out";

    default:
      return status;
  }
}


function ratePlanLabel(
  ratePlan: string | null,
): string | null {
  if (
    ratePlan === "with_breakfast"
  ) {
    return "With breakfast";
  }

  if (
    ratePlan === "without_breakfast"
  ) {
    return "Room only";
  }

  return null;
}


export default function ReservationStatusSection() {
  const [reference, setReference] =
    useState("");

  const [contact, setContact] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    reservation,
    setReservation,
  ] = useState<
    ReservationStatusLookupResponse | null
  >(null);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setReservation(null);

    const trimmedReference =
      reference.trim();

    const trimmedContact =
      contact.trim();

    if (!trimmedReference) {
      setError(
        "Enter your reservation reference.",
      );

      return;
    }

    if (!trimmedContact) {
      setError(
        "Enter the email address or phone number used for the reservation.",
      );

      return;
    }

    const isEmail =
      trimmedContact.includes("@");

    try {
      setLoading(true);

      const result =
        await lookupReservationStatus({
          reference:
            trimmedReference,
          email: isEmail
            ? trimmedContact
            : null,
          phone: isEmail
            ? null
            : trimmedContact,
        });

      setReservation(result);
    } catch (err) {
      if (
        err instanceof Error
      ) {
        setError(
          err.message,
        );
      } else {
        setError(
          "We could not check your reservation.",
        );
      }
    } finally {
      setLoading(false);
    }
  }


  const planLabel =
    reservation
      ? ratePlanLabel(
          reservation.rate_plan,
        )
      : null;


  return (
    <section
      id="reservation-status"
      className="border-t border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Existing reservation
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Check your reservation.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Enter your reservation
              reference together with the
              email address or phone number
              used when you sent the request.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm leading-6 text-slate-600">
                Your reservation reference
                looks like{" "}
                <span className="font-mono font-semibold text-slate-900">
                  SW-XXXXXXXXXXXX
                </span>
                .
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-7">
            <form
              onSubmit={handleSubmit}
            >
              <div className="grid gap-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Reservation reference
                  </span>

                  <input
                    type="text"
                    value={reference}
                    onChange={(event) => {
                      setReference(
                        event.target.value,
                      );
                      setError(null);
                    }}
                    placeholder="SW-XXXXXXXXXXXX"
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email or phone
                  </span>

                  <input
                    type="text"
                    value={contact}
                    onChange={(event) => {
                      setContact(
                        event.target.value,
                      );
                      setError(null);
                    }}
                    placeholder="Email address or phone number"
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Checking..."
                    : "Check reservation"}
                </button>
              </div>
            </form>

            {reservation && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                      Reservation status
                    </p>

                    <p className="mt-2 font-mono text-sm font-semibold text-slate-600">
                      {
                        reservation.reference
                      }
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800">
                    {statusLabel(
                      reservation.status,
                    )}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">
                      Check-in
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {
                        reservation.check_in
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">
                      Check-out
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {
                        reservation.check_out
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">
                      Guests
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {
                        reservation.guest_count
                      }
                    </p>
                  </div>

                  {reservation.room_type_name && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">
                        Room type
                      </p>

                      <p className="mt-1 font-semibold text-slate-950">
                        {
                          reservation.room_type_name
                        }
                      </p>
                    </div>
                  )}

                  {planLabel && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">
                        Rate option
                      </p>

                      <p className="mt-1 font-semibold text-slate-950">
                        {planLabel}
                      </p>
                    </div>
                  )}

                  {reservation.quoted_rate !==
                    null && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">
                        Nightly rate
                      </p>

                      <p className="mt-1 font-semibold text-slate-950">
                        {peso(
                          reservation.quoted_rate,
                        )}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">
                      Room total
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {peso(
                        reservation.total_amount,
                      )}
                    </p>
                  </div>
                </div>

                {reservation.cottage_name &&
                reservation.room_name ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Assigned accommodation
                    </p>

                    <p className="mt-2 font-semibold text-emerald-950">
                      {
                        reservation.cottage_name
                      }{" "}
                      ·{" "}
                      {
                        reservation.room_name
                      }
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm leading-6 text-amber-900">
                      The exact cottage and
                      room have not been
                      assigned yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
