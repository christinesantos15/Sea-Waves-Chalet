"use client";

import {
  useEffect,
  useState,
} from "react";

import type { PropertyMapLocation } from "@/components/property-map/types";
import {
  createReservationRequest,
  getCottageAvailability,
  getCottageDetail,
  type CottageAvailability,
  type CottageDetail,
  type CustomerReservationResponse,
} from "@/lib/clientResortApi";

type CustomerPropertyMapProps = {
  locations: PropertyMapLocation[];
};

function formatRate(
  value: string | number | null,
) {
  if (value === null) {
    return "To be confirmed";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "To be confirmed";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}

export default function CustomerPropertyMap({
  locations,
}: CustomerPropertyMapProps) {
  const [selected, setSelected] =
    useState<PropertyMapLocation | null>(null);

  const [cottageDetail, setCottageDetail] =
    useState<CottageDetail | null>(null);

  const [loadingCottage, setLoadingCottage] =
    useState(false);

  const [cottageError, setCottageError] =
    useState<string | null>(null);

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [availability, setAvailability] =
    useState<CottageAvailability | null>(
      null,
    );

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState(false);

  const [
    availabilityError,
    setAvailabilityError,
  ] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] =
    useState<number | null>(null);

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
    submittingReservation,
    setSubmittingReservation,
  ] = useState(false);

  const [
    reservationError,
    setReservationError,
  ] = useState<string | null>(null);

  const [
    reservationSuccess,
    setReservationSuccess,
  ] =
    useState<CustomerReservationResponse | null>(
      null,
    );

  useEffect(() => {
    setCottageDetail(null);
    setCottageError(null);

    setCheckIn("");
    setCheckOut("");

    setAvailability(null);
    setAvailabilityError(null);

    setSelectedRoomId(null);

    setGuestCount(1);
    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");

    setReservationError(null);
    setReservationSuccess(null);

    if (
      selected?.type !== "cottage" ||
      selected.databaseId === undefined
    ) {
      setLoadingCottage(false);
      return;
    }

    const cottageId =
      selected.databaseId;

    const controller =
      new AbortController();

    async function loadCottage() {
      try {
        setLoadingCottage(true);

        const detail =
          await getCottageDetail(
            cottageId,
            controller.signal,
          );

        setCottageDetail(detail);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setCottageError(
          "We could not load the room information.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCottage(false);
        }
      }
    }

    void loadCottage();

    return () => {
      controller.abort();
    };
  }, [selected]);

  function resetBookingSelection() {
    setSelectedRoomId(null);

    setReservationError(null);
    setReservationSuccess(null);
  }

  async function handleAvailabilityCheck() {
    if (
      selected?.type !== "cottage" ||
      selected.databaseId === undefined
    ) {
      return;
    }

    setAvailability(null);
    setAvailabilityError(null);

    resetBookingSelection();

    if (!checkIn || !checkOut) {
      setAvailabilityError(
        "Choose both a check-in and check-out date.",
      );

      return;
    }

    if (checkOut <= checkIn) {
      setAvailabilityError(
        "Check-out must be after check-in.",
      );

      return;
    }

    try {
      setLoadingAvailability(true);

      const result =
        await getCottageAvailability(
          selected.databaseId,
          checkIn,
          checkOut,
        );

      setAvailability(result);
    } catch (error) {
      if (error instanceof Error) {
        setAvailabilityError(
          error.message,
        );
      } else {
        setAvailabilityError(
          "We could not check availability.",
        );
      }
    } finally {
      setLoadingAvailability(false);
    }
  }

  async function refreshAvailability() {
    if (
      selected?.type !== "cottage" ||
      selected.databaseId === undefined ||
      !checkIn ||
      !checkOut
    ) {
      return;
    }

    const result =
      await getCottageAvailability(
        selected.databaseId,
        checkIn,
        checkOut,
      );

    setAvailability(result);
  }

  async function handleReservationSubmit() {
    if (
      selected?.type !== "cottage" ||
      selected.databaseId === undefined ||
      selectedRoomId === null
    ) {
      return;
    }

    setReservationError(null);
    setReservationSuccess(null);

    const trimmedName =
      fullName.trim();

    const trimmedPhone =
      phone.trim();

    const trimmedEmail =
      email.trim();

    const trimmedNotes =
      notes.trim();

    if (!checkIn || !checkOut) {
      setReservationError(
        "Choose your stay dates first.",
      );

      return;
    }

    if (checkOut <= checkIn) {
      setReservationError(
        "Check-out must be after check-in.",
      );

      return;
    }

    if (!trimmedName) {
      setReservationError(
        "Enter your full name.",
      );

      return;
    }

    if (
      !trimmedPhone &&
      !trimmedEmail
    ) {
      setReservationError(
        "Provide either a phone number or email address.",
      );

      return;
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      setReservationError(
        "Guest count must be at least 1.",
      );

      return;
    }

    try {
      setSubmittingReservation(true);

      const result =
        await createReservationRequest({
          cottage_id:
            selected.databaseId,
          room_id: selectedRoomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guestCount,
          full_name: trimmedName,
          phone:
            trimmedPhone || null,
          email:
            trimmedEmail || null,
          notes:
            trimmedNotes || null,
        });

      setReservationSuccess(result);

      await refreshAvailability();

      setSelectedRoomId(null);
    } catch (error) {
      if (error instanceof Error) {
        setReservationError(
          error.message,
        );
      } else {
        setReservationError(
          "We could not submit your reservation request.",
        );
      }
    } finally {
      setSubmittingReservation(false);
    }
  }

  const selectedRoom =
    cottageDetail?.rooms.find(
      (room) =>
        room.id === selectedRoomId,
    ) ?? null;

  return (
    <section>
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          Discover the resort
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Explore Sea Waves Chalet
        </h2>

        <p className="mt-3 text-base leading-7 text-slate-600">
          Select a cottage or resort location
          directly from the property map.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-6 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)]">
          <div className="relative mx-auto">
            <img
              src="/resort/sea-waves-map.png"
              alt="Sea Waves Chalet property map"
              draggable={false}
              className="block h-auto w-full select-none"
            />

            {locations.map((location) => {
              const isSelected =
                selected?.id === location.id;

              const isCottage =
                location.type === "cottage";

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() =>
                    setSelected(location)
                  }
                  style={{
                    left: `${location.x}%`,
                    top: `${location.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border text-xs font-semibold shadow-md backdrop-blur-md transition-all duration-200 ${
                    isCottage
                      ? "rounded-lg px-2.5 py-1"
                      : "rounded-full px-3 py-1.5"
                  } ${
                    isSelected
                      ? "scale-105 border-white bg-sky-600 text-white ring-4 ring-sky-200/60"
                      : isCottage
                        ? "border-white/90 bg-white/90 text-slate-900 hover:bg-emerald-600 hover:text-white"
                        : "border-white/80 bg-white/85 text-slate-900 hover:bg-white"
                  }`}
                >
                  {location.name}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          {!selected && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Interactive Map
              </p>

              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                Choose a location
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select a cottage or resort
                amenity to explore more
                information.
              </p>
            </>
          )}

          {selected &&
            selected.type !== "cottage" && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Resort Location
                </p>

                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  {selected.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selected.description}
                </p>
              </>
            )}

          {selected?.type === "cottage" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Accommodation
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {selected.name}
                  </h3>
                </div>

                {selected.status && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                    {selected.status}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selected.description}
              </p>

              {loadingCottage && (
                <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">
                    Loading rooms...
                  </p>
                </div>
              )}

              {cottageError && (
                <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-5">
                  <p className="text-sm text-red-700">
                    {cottageError}
                  </p>
                </div>
              )}

              {cottageDetail &&
                !loadingCottage && (
                  <>
                    <div className="mt-7 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                      <h4 className="font-semibold text-slate-950">
                        Check availability
                      </h4>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-medium text-slate-600">
                            Check-in
                          </span>

                          <input
                            type="date"
                            value={checkIn}
                            onChange={(event) => {
                              setCheckIn(
                                event.target.value,
                              );

                              setAvailability(
                                null,
                              );

                              setAvailabilityError(
                                null,
                              );

                              resetBookingSelection();
                            }}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-medium text-slate-600">
                            Check-out
                          </span>

                          <input
                            type="date"
                            value={checkOut}
                            min={
                              checkIn ||
                              undefined
                            }
                            onChange={(event) => {
                              setCheckOut(
                                event.target.value,
                              );

                              setAvailability(
                                null,
                              );

                              setAvailabilityError(
                                null,
                              );

                              resetBookingSelection();
                            }}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleAvailabilityCheck()
                        }
                        disabled={
                          loadingAvailability
                        }
                        className="mt-4 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingAvailability
                          ? "Checking..."
                          : "Check availability"}
                      </button>

                      {availabilityError && (
                        <p className="mt-3 text-sm text-red-600">
                          {availabilityError}
                        </p>
                      )}
                    </div>

                    <div className="mt-7 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-950">
                          Rooms
                        </h4>

                        <span className="text-xs text-slate-500">
                          {
                            cottageDetail
                              .rooms.length
                          }{" "}
                          rooms
                        </span>
                      </div>

                      {cottageDetail.rooms.map(
                        (room) => {
                          const availabilityRoom =
                            availability?.rooms.find(
                              (
                                candidate,
                              ) =>
                                candidate.id ===
                                room.id,
                            );

                          return (
                            <div
                              key={room.id}
                              className="rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:bg-sky-50/40"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-950">
                                    {room.name}
                                  </p>

                                  <p className="mt-1 text-xs capitalize text-slate-500">
                                    {room.status}
                                  </p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {room.code}
                                  </span>

                                  {availabilityRoom && (
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        availabilityRoom.available
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {availabilityRoom.available
                                        ? "Available"
                                        : "Unavailable"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Capacity
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {room.capacity ===
                                    null
                                      ? "To be confirmed"
                                      : `${room.capacity} guests`}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Rate
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatRate(
                                      room.base_rate,
                                    )}
                                  </p>
                                </div>
                              </div>

                              {availabilityRoom?.available && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoomId(
                                      room.id,
                                    );

                                    setReservationError(
                                      null,
                                    );

                                    setReservationSuccess(
                                      null,
                                    );
                                  }}
                                  className="mt-4 w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                                >
                                  Request this room
                                </button>
                              )}
                            </div>
                          );
                        },
                      )}

                      {availability && (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          Availability for{" "}
                          <span className="font-medium text-slate-900">
                            {availability.check_in}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-slate-900">
                            {availability.check_out}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedRoom && (
                      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Reservation Request
                        </p>

                        <h4 className="mt-2 text-xl font-semibold text-slate-950">
                          {selected.name} ·{" "}
                          {selectedRoom.name}
                        </h4>

                        <p className="mt-2 text-sm text-slate-500">
                          {checkIn} → {checkOut}
                        </p>

                        <div className="mt-5 space-y-4">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Number of guests
                            </span>

                            <input
                              type="number"
                              min={1}
                              value={guestCount}
                              onChange={(event) => {
                                const value =
                                  Number(
                                    event.target
                                      .value,
                                  );

                                setGuestCount(
                                  value,
                                );
                              }}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Full name
                            </span>

                            <input
                              type="text"
                              value={fullName}
                              onChange={(event) =>
                                setFullName(
                                  event.target
                                    .value,
                                )
                              }
                              placeholder="Your full name"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Phone
                            </span>

                            <input
                              type="tel"
                              value={phone}
                              onChange={(event) =>
                                setPhone(
                                  event.target
                                    .value,
                                )
                              }
                              placeholder="Phone number"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Email
                            </span>

                            <input
                              type="email"
                              value={email}
                              onChange={(event) =>
                                setEmail(
                                  event.target
                                    .value,
                                )
                              }
                              placeholder="Email address"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <p className="text-xs text-slate-500">
                            Provide at least a phone
                            number or email address.
                          </p>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Notes
                            </span>

                            <textarea
                              value={notes}
                              onChange={(event) =>
                                setNotes(
                                  event.target
                                    .value,
                                )
                              }
                              rows={3}
                              placeholder="Anything the resort should know?"
                              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          {reservationError && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                              <p className="text-sm text-red-700">
                                {reservationError}
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void handleReservationSubmit()
                            }
                            disabled={
                              submittingReservation
                            }
                            className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingReservation
                              ? "Submitting..."
                              : "Submit reservation request"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(
                                null,
                              );

                              setReservationError(
                                null,
                              );
                            }}
                            disabled={
                              submittingReservation
                            }
                            className="w-full rounded-xl px-5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {reservationSuccess && (
                      <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Request received
                        </p>

                        <h4 className="mt-2 text-xl font-semibold text-slate-950">
                          Your reservation request
                          has been submitted.
                        </h4>

                        <div className="mt-4 rounded-xl bg-white/80 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Reference
                          </p>

                          <p className="mt-1 font-mono text-base font-semibold text-slate-950">
                            {
                              reservationSuccess.reference
                            }
                          </p>

                          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize text-amber-700">
                            {
                              reservationSuccess.status
                            }
                          </p>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {
                            reservationSuccess.message
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}