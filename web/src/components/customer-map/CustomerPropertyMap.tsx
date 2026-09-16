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


const locationMeta: Record<
  PropertyMapLocation["type"],
  {
    label: string;
    symbol: string;
  }
> = {
  cottage: {
    label: "Cottages",
    symbol: "⌂",
  },
  pool: {
    label: "Swimming Pool",
    symbol: "◉",
  },
  event_hall: {
    label: "Event Hall",
    symbol: "E",
  },
  billiards: {
    label: "Billiards",
    symbol: "8",
  },
  beach: {
    label: "Beach Access",
    symbol: "≈",
  },
  entrance: {
    label: "Entrance",
    symbol: "↗",
  },
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

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}


function isAbortError(
  error: unknown,
) {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}


function shortLocationName(
  location: PropertyMapLocation,
) {
  if (location.type !== "cottage") {
    return locationMeta[
      location.type
    ].symbol;
  }

  const match = location.name.match(
    /^Cottage\s*(\d+)$/i,
  );

  if (match) {
    return `C${match[1]}`;
  }

  return location.name;
}


function markerClasses(
  location: PropertyMapLocation,
  isSelected: boolean,
) {
  if (location.type === "cottage") {
    return isSelected
      ? "scale-110 border-white bg-slate-950 text-white ring-4 ring-white/70 shadow-xl"
      : "border-white/90 bg-white/95 text-slate-950 shadow-lg hover:-translate-y-1 hover:bg-slate-950 hover:text-white";
  }

  if (isSelected) {
    return "scale-110 border-white bg-sky-600 text-white ring-4 ring-sky-200/80 shadow-xl";
  }

  return "border-white/90 bg-sky-50/95 text-sky-950 shadow-lg hover:-translate-y-1 hover:bg-sky-600 hover:text-white";
}


export default function CustomerPropertyMap({
  locations,
}: CustomerPropertyMapProps) {
  const [selected, setSelected] =
    useState<PropertyMapLocation | null>(
      null,
    );

  const [
    cottageDetail,
    setCottageDetail,
  ] =
    useState<CottageDetail | null>(
      null,
    );

  const [
    loadingCottage,
    setLoadingCottage,
  ] = useState(false);

  const [
    cottageError,
    setCottageError,
  ] =
    useState<string | null>(null);

  const [checkIn, setCheckIn] =
    useState("");

  const [checkOut, setCheckOut] =
    useState("");

  const [
    availability,
    setAvailability,
  ] =
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
  ] =
    useState<string | null>(null);

  const [
    selectedRoomId,
    setSelectedRoomId,
  ] =
    useState<number | null>(null);

  const [
    guestCount,
    setGuestCount,
  ] = useState(1);

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
  ] =
    useState<string | null>(null);

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
        if (
          !controller.signal.aborted
        ) {
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
      !Number.isInteger(
        guestCount,
      ) ||
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

  const cottageCount =
    locations.filter(
      (location) =>
        location.type === "cottage",
    ).length;


  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Explore the property
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Choose where you want to stay.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Tap a cottage directly on the
            resort map, check its rooms,
            choose your dates, and send a
            reservation request.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {cottageCount} cottages
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Beach access
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Pool & recreation
          </span>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Interactive resort map
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Tap any marker to explore.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
              Cottages

              <span className="ml-2 h-2.5 w-2.5 rounded-full bg-sky-500" />
              Amenities
            </div>
          </div>

          <div className="bg-slate-100 p-2 sm:p-4">
            <div className="relative mx-auto overflow-hidden rounded-[1.5rem] bg-slate-200">
              <img
                src="/resort/sea-waves-aerial.png"
                alt="Aerial view of Sea Waves Chalet"
                draggable={false}
                className="block h-auto w-full select-none"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-white/5" />

              {locations.map(
                (location) => {
                  const isSelected =
                    selected?.id ===
                    location.id;

                  return (
                    <button
                      key={location.id}
                      type="button"
                      aria-label={`Explore ${location.name}`}
                      title={location.name}
                      onClick={() =>
                        setSelected(
                          location,
                        )
                      }
                      style={{
                        left: `${location.x}%`,
                        top: `${location.y}%`,
                      }}
                      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 border text-xs font-bold backdrop-blur-md transition duration-200 ${
                        location.type ===
                        "cottage"
                          ? "min-w-9 rounded-xl px-2.5 py-2"
                          : "flex h-9 w-9 items-center justify-center rounded-full"
                      } ${markerClasses(
                        location,
                        isSelected,
                      )}`}
                    >
                      {shortLocationName(
                        location,
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-100 bg-white p-4 sm:grid-cols-3 sm:p-5">
            {(
              [
                "pool",
                "beach",
                "event_hall",
                "billiards",
                "entrance",
              ] as const
            ).map((type) => {
              const location =
                locations.find(
                  (candidate) =>
                    candidate.type ===
                    type,
                );

              if (!location) {
                return null;
              }

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() =>
                    setSelected(
                      location,
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                    {
                      locationMeta[type]
                        .symbol
                    }
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {location.name}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] sm:p-7 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          {!selected && (
            <div className="flex min-h-64 flex-col justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl text-sky-700">
                ↗
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Interactive resort map
              </p>

              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Start with the map.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select one of the cottages
                to view its rooms and check
                availability, or explore the
                resort&apos;s amenities.
              </p>
            </div>
          )}

          {selected &&
            selected.type !==
              "cottage" && (
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-sky-700">
                  {
                    locationMeta[
                      selected.type
                    ].symbol
                  }
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  {
                    locationMeta[
                      selected.type
                    ].label
                  }
                </p>

                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {selected.name}
                </h3>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {selected.description ??
                    "More information about this resort location will be available soon."}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSelected(null)
                  }
                  className="mt-7 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
                >
                  ← Back to map
                </button>
              </div>
            )}

          {selected?.type ===
            "cottage" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Accommodation
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {selected.name}
                  </h3>
                </div>

                {selected.status && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                    {selected.status}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selected.description}
              </p>

              {loadingCottage && (
                <div className="mt-6 animate-pulse space-y-3 rounded-2xl bg-slate-50 p-5">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-10 rounded-xl bg-slate-200" />
                  <div className="h-10 rounded-xl bg-slate-200" />
                </div>
              )}

              {cottageError && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    {cottageError}
                  </p>
                </div>
              )}

              {cottageDetail &&
                !loadingCottage && (
                  <>
                    <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-950">
                            Your stay
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Choose your dates
                            to see available
                            rooms.
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          {
                            cottageDetail
                              .rooms.length
                          }{" "}
                          rooms
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-medium text-slate-600">
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

                              setAvailability(
                                null,
                              );

                              setAvailabilityError(
                                null,
                              );

                              resetBookingSelection();
                            }}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
                            onChange={(
                              event,
                            ) => {
                              setCheckOut(
                                event.target
                                  .value,
                              );

                              setAvailability(
                                null,
                              );

                              setAvailabilityError(
                                null,
                              );

                              resetBookingSelection();
                            }}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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
                          ? "Checking availability..."
                          : "Check availability"}
                      </button>

                      {availabilityError && (
                        <p className="mt-3 text-sm text-red-600">
                          {
                            availabilityError
                          }
                        </p>
                      )}
                    </div>

                    {reservationSuccess && (
                      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Request received
                        </p>

                        <p className="mt-2 font-semibold text-emerald-950">
                          Reference{" "}
                          {
                            reservationSuccess.reference
                          }
                        </p>

                        <p className="mt-2 text-sm leading-6 text-emerald-800">
                          {
                            reservationSuccess.message
                          }
                        </p>
                      </div>
                    )}

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-950">
                          Rooms
                        </h4>

                        {!availability && (
                          <span className="text-xs text-slate-400">
                            Check dates first
                          </span>
                        )}
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

                          const isRoomSelected =
                            selectedRoomId ===
                            room.id;

                          return (
                            <div
                              key={room.id}
                              className={`rounded-2xl border p-4 transition ${
                                isRoomSelected
                                  ? "border-sky-300 bg-sky-50/70 ring-2 ring-sky-100"
                                  : "border-slate-200 bg-white hover:border-sky-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-950">
                                    {
                                      room.name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs capitalize text-slate-500">
                                    {
                                      room.status
                                    }
                                  </p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {
                                      room.code
                                    }
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

                              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
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
                                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
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
                                  className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    isRoomSelected
                                      ? "bg-sky-600 text-white"
                                      : "border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                  }`}
                                >
                                  {isRoomSelected
                                    ? "Room selected"
                                    : "Request this room"}
                                </button>
                              )}
                            </div>
                          );
                        },
                      )}

                      {availability && (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                          Showing availability
                          from{" "}
                          <span className="font-medium text-slate-900">
                            {
                              availability.check_in
                            }
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-slate-900">
                            {
                              availability.check_out
                            }
                          </span>
                          .
                        </div>
                      )}
                    </div>

                    {selectedRoom && (
                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Reservation request
                        </p>

                        <h4 className="mt-2 text-xl font-semibold text-slate-950">
                          {selected.name} ·{" "}
                          {
                            selectedRoom.name
                          }
                        </h4>

                        <p className="mt-2 text-sm text-slate-500">
                          {checkIn} →{" "}
                          {checkOut}
                        </p>

                        <div className="mt-5 space-y-4">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Number of
                              guests
                            </span>

                            <input
                              type="number"
                              min={1}
                              value={
                                guestCount
                              }
                              onChange={(
                                event,
                              ) =>
                                setGuestCount(
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Full name
                            </span>

                            <input
                              type="text"
                              value={
                                fullName
                              }
                              onChange={(
                                event,
                              ) =>
                                setFullName(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="Your full name"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">
                                Phone
                              </span>

                              <input
                                type="tel"
                                value={
                                  phone
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setPhone(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Phone number"
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">
                                Email
                              </span>

                              <input
                                type="email"
                                value={
                                  email
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setEmail(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="Email address"
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>
                          </div>

                          <p className="text-xs leading-5 text-slate-500">
                            Provide at least
                            a phone number or
                            email address so
                            the resort can
                            contact you.
                          </p>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">
                              Notes
                            </span>

                            <textarea
                              value={notes}
                              onChange={(
                                event,
                              ) =>
                                setNotes(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              rows={3}
                              placeholder="Anything the resort should know?"
                              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </label>

                          {reservationError && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                              <p className="text-sm text-red-700">
                                {
                                  reservationError
                                }
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
                              : "Send reservation request"}
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
                            className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-950"
                          >
                            Choose another
                            room
                          </button>
                        </div>
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
