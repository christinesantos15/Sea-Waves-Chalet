"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createRoomTypeReservationRequest,
  type RoomTypeRatePlan,
  type RoomTypeReservationResponse,
} from "@/lib/clientResortApi";

import type {
  PublicRoomRate,
  PublicRoomTypePricing,
} from "@/lib/publicPricingApi";


type Props = {
  roomTypes: PublicRoomTypePricing[];
};


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


function findRate(
  rates: PublicRoomRate[],
  plan: RoomTypeRatePlan,
): PublicRoomRate | undefined {
  return rates.find(
    (rate) =>
      rate.rate_plan === plan,
  );
}


function calculateNights(
  checkIn: string,
  checkOut: string,
): number {
  if (
    !checkIn ||
    !checkOut
  ) {
    return 0;
  }

  const start =
    Date.parse(
      `${checkIn}T00:00:00Z`,
    );

  const end =
    Date.parse(
      `${checkOut}T00:00:00Z`,
    );

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start
  ) {
    return 0;
  }

  return Math.round(
    (end - start) /
      (1000 * 60 * 60 * 24),
  );
}


export default function RoomTypeBookingSection({
  roomTypes,
}: Props) {
  const [
    selectedRoomTypeId,
    setSelectedRoomTypeId,
  ] = useState<string>("");

  const [
    ratePlan,
    setRatePlan,
  ] = useState<RoomTypeRatePlan>(
    "with_breakfast",
  );

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [guestCount, setGuestCount] =
    useState(1);

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    success,
    setSuccess,
  ] = useState<
    RoomTypeReservationResponse | null
  >(null);


  useEffect(() => {
    function handleRoomTypeSelection(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<{
          roomTypeId: number;
        }>;

      const roomType =
        roomTypes.find(
          (candidate) =>
            candidate.id ===
            customEvent.detail
              .roomTypeId,
        );

      if (!roomType) {
        return;
      }

      setSelectedRoomTypeId(
        String(roomType.id),
      );

      const hasBreakfast =
        roomType.rates.some(
          (rate) =>
            rate.rate_plan ===
            "with_breakfast",
        );

      const hasRoomOnly =
        roomType.rates.some(
          (rate) =>
            rate.rate_plan ===
            "without_breakfast",
        );

      if (hasBreakfast) {
        setRatePlan(
          "with_breakfast",
        );
      } else if (hasRoomOnly) {
        setRatePlan(
          "without_breakfast",
        );
      }

      setGuestCount(
        (current) =>
          Math.min(
            Math.max(current, 1),
            roomType.capacity,
          ),
      );

      setError(null);
      setSuccess(null);
    }

    window.addEventListener(
      "sea-waves:select-room-type",
      handleRoomTypeSelection,
    );

    return () => {
      window.removeEventListener(
        "sea-waves:select-room-type",
        handleRoomTypeSelection,
      );
    };
  }, [roomTypes]);


  const selectedRoomType =
    useMemo(
      () =>
        roomTypes.find(
          (roomType) =>
            roomType.id ===
            Number(
              selectedRoomTypeId,
            ),
        ) ?? null,
      [
        roomTypes,
        selectedRoomTypeId,
      ],
    );


  const selectedRate =
    useMemo(
      () =>
        selectedRoomType
          ? findRate(
              selectedRoomType.rates,
              ratePlan,
            )
          : undefined,
      [
        selectedRoomType,
        ratePlan,
      ],
    );


  const nights =
    calculateNights(
      checkIn,
      checkOut,
    );


  const estimatedTotal =
    selectedRate && nights > 0
      ? Number(
          selectedRate.amount,
        ) * nights
      : null;


  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!selectedRoomType) {
      setError(
        "Choose a room type.",
      );

      return;
    }

    if (
      !checkIn ||
      !checkOut
    ) {
      setError(
        "Choose your check-in and check-out dates.",
      );

      return;
    }

    if (nights < 1) {
      setError(
        "Check-out must be after check-in.",
      );

      return;
    }

    if (
      !Number.isInteger(
        guestCount,
      ) ||
      guestCount < 1
    ) {
      setError(
        "Guest count must be at least 1.",
      );

      return;
    }

    if (
      guestCount >
      selectedRoomType.capacity
    ) {
      setError(
        `${selectedRoomType.name} allows up to ${selectedRoomType.capacity} guests.`,
      );

      return;
    }

    if (!selectedRate) {
      setError(
        "That rate option is not currently available.",
      );

      return;
    }

    const trimmedName =
      fullName.trim();

    const trimmedPhone =
      phone.trim();

    const trimmedEmail =
      email.trim();

    const trimmedNotes =
      notes.trim();

    if (!trimmedName) {
      setError(
        "Enter your full name.",
      );

      return;
    }

    if (
      !trimmedPhone &&
      !trimmedEmail
    ) {
      setError(
        "Provide either a phone number or email address.",
      );

      return;
    }

    try {
      setSubmitting(true);

      const result =
        await createRoomTypeReservationRequest(
          {
            room_type_id:
              selectedRoomType.id,

            rate_plan:
              ratePlan,

            check_in:
              checkIn,

            check_out:
              checkOut,

            guest_count:
              guestCount,

            full_name:
              trimmedName,

            phone:
              trimmedPhone ||
              null,

            email:
              trimmedEmail ||
              null,

            notes:
              trimmedNotes ||
              null,
          },
        );

      setSuccess(result);
    } catch (err) {
      if (
        err instanceof Error
      ) {
        setError(
          err.message,
        );
      } else {
        setError(
          "We could not submit your reservation request.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <section
      id="book"
      className="border-t border-slate-200 bg-slate-50"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Reservation request
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Plan your stay.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Choose the room type
              that fits your group,
              select your rate option,
              and send your stay
              request to the resort.
            </p>

            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <p className="text-sm font-semibold text-sky-950">
                How booking works
              </p>

              <p className="mt-2 text-sm leading-6 text-sky-900">
                You request a room
                type rather than a
                specific cottage.
                The resort confirms
                the exact physical
                room after reviewing
                your request.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Request received
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-emerald-950">
                  {success.room_type_name}
                </h3>

                <p className="mt-2 font-mono text-sm font-semibold text-emerald-800">
                  {success.reference}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/70 p-4">
                    <p className="text-xs text-emerald-700">
                      Rate
                    </p>

                    <p className="mt-1 font-semibold text-emerald-950">
                      {peso(
                        success.quoted_rate,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/70 p-4">
                    <p className="text-xs text-emerald-700">
                      Nights
                    </p>

                    <p className="mt-1 font-semibold text-emerald-950">
                      {success.nights}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/70 p-4">
                    <p className="text-xs text-emerald-700">
                      Room total
                    </p>

                    <p className="mt-1 font-semibold text-emerald-950">
                      {peso(
                        success.total_amount,
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-emerald-800">
                  {success.message}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(null);
                    setSelectedRoomTypeId(
                      "",
                    );
                    setCheckIn("");
                    setCheckOut("");
                    setGuestCount(1);
                    setFullName("");
                    setPhone("");
                    setEmail("");
                    setNotes("");
                  }}
                  className="mt-5 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Room type
                    </span>

                    <select
                      value={
                        selectedRoomTypeId
                      }
                      onChange={(
                        event,
                      ) => {
                        setSelectedRoomTypeId(
                          event.target
                            .value,
                        );

                        setError(null);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">
                        Choose a room type
                      </option>

                      {roomTypes.map(
                        (roomType) => (
                          <option
                            key={
                              roomType.id
                            }
                            value={
                              roomType.id
                            }
                          >
                            {
                              roomType.name
                            }{" "}
                            · up to{" "}
                            {
                              roomType.capacity
                            }{" "}
                            guests
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Check-in
                    </span>

                    <input
                      type="date"
                      value={checkIn}
                      onChange={(
                        event,
                      ) => {
                        setCheckIn(
                          event.target
                            .value,
                        );

                        setError(null);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Check-out
                    </span>

                    <input
                      type="date"
                      value={checkOut}
                      min={
                        checkIn ||
                        undefined
                      }
                      onChange={(
                        event,
                      ) => {
                        setCheckOut(
                          event.target
                            .value,
                        );

                        setError(null);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                </div>

                {selectedRoomType && (
                  <div className="mt-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {
                            selectedRoomType.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Maximum{" "}
                          {
                            selectedRoomType.capacity
                          }{" "}
                          guests
                        </p>
                      </div>

                      {nights > 0 && (
                        <p className="text-sm font-medium text-slate-600">
                          {nights}{" "}
                          {nights === 1
                            ? "night"
                            : "nights"}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          "without_breakfast",
                          "with_breakfast",
                        ] as RoomTypeRatePlan[]
                      ).map(
                        (plan) => {
                          const rate =
                            findRate(
                              selectedRoomType.rates,
                              plan,
                            );

                          const active =
                            ratePlan ===
                            plan;

                          return (
                            <button
                              key={
                                plan
                              }
                              type="button"
                              disabled={
                                !rate
                              }
                              onClick={() => {
                                setRatePlan(
                                  plan,
                                );

                                setError(
                                  null,
                                );
                              }}
                              className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                active
                                  ? "border-sky-400 bg-sky-50 ring-2 ring-sky-100"
                                  : "border-slate-200 bg-white hover:border-sky-200"
                              }`}
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {plan ===
                                "with_breakfast"
                                  ? "With breakfast"
                                  : "Room only"}
                              </p>

                              <p className="mt-2 text-xl font-semibold text-slate-950">
                                {rate
                                  ? peso(
                                      rate.amount,
                                    )
                                  : "Unavailable"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                per night
                              </p>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Guests
                    </span>

                    <input
                      type="number"
                      min={1}
                      max={
                        selectedRoomType?.capacity
                      }
                      value={guestCount}
                      onChange={(
                        event,
                      ) =>
                        setGuestCount(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Estimated room total
                    </p>

                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {estimatedTotal !==
                      null
                        ? peso(
                            estimatedTotal,
                          )
                        : "Choose dates and a rate"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Extra charges,
                      if applicable,
                      are separate.
                    </p>
                  </div>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Full name
                    </span>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(
                        event,
                      ) =>
                        setFullName(
                          event.target
                            .value,
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Phone
                    </span>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(
                        event,
                      ) =>
                        setPhone(
                          event.target
                            .value,
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Email
                    </span>

                    <input
                      type="email"
                      value={email}
                      onChange={(
                        event,
                      ) =>
                        setEmail(
                          event.target
                            .value,
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Notes
                    </span>

                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(
                        event,
                      ) =>
                        setNotes(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Arrival details, questions, or other requests"
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleSubmit()
                  }
                  disabled={
                    submitting
                  }
                  className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Sending request..."
                    : "Send reservation request"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Sending a request
                  does not confirm the
                  booking yet. The resort
                  will review availability
                  and assign the exact
                  cottage and room.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
