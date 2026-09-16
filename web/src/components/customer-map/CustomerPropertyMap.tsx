"use client";

import {
  useEffect,
  useState,
} from "react";

import type { PropertyMapLocation } from "@/components/property-map/types";
import {
  getCottageDetail,
  type CottageDetail,
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


  useEffect(() => {
    setCottageDetail(null);
    setCottageError(null);


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
            resort map to explore its rooms
            and location, or discover the
            resort&apos;s amenities.
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
                to explore its rooms and
                location, or discover the
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
                {selected.description ??
                  "More information about this cottage will be available soon."}
              </p>

              {loadingCottage && (
                <div className="mt-6 animate-pulse space-y-3 rounded-2xl bg-slate-50 p-5">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-20 rounded-xl bg-slate-200" />
                  <div className="h-20 rounded-xl bg-slate-200" />
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
                    <div className="mt-6 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-950">
                          Rooms in this cottage
                        </h4>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Explore the physical
                          rooms in this cottage.
                          Reservations are made
                          by room type.
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {
                          cottageDetail.rooms
                            .length
                        }{" "}
                        rooms
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {cottageDetail.rooms.map(
                        (room) => (
                          <div
                            key={room.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">
                                  {
                                    room.name
                                  }
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {room.description ??
                                    "Room details are still to be confirmed."}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                                {
                                  room.code
                                }
                              </span>
                            </div>

                            {room.capacity !==
                              null && (
                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                  Capacity
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {
                                    room.capacity
                                  }{" "}
                                  {room.capacity ===
                                  1
                                    ? "guest"
                                    : "guests"}
                                </p>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        Interested in staying here?
                      </p>

                      <p className="mt-2 text-sm leading-6 text-sky-950">
                        Compare the resort&apos;s
                        room types and current
                        rates, then send your
                        reservation request.
                        The exact cottage and
                        room are assigned by
                        the resort.
                      </p>

                      <div className="mt-4 grid gap-2">
                        <a
                          href="#rates"
                          className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                        >
                          Compare room types
                        </a>

                        <a
                          href="#book"
                          className="rounded-xl bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Book your stay
                        </a>
                      </div>
                    </div>
                  </>
                )}

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                className="mt-6 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
              >
                ← Back to map
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
