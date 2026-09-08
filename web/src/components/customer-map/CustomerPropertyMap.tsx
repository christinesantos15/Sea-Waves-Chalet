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

    const controller = new AbortController();

    async function loadCottage() {
      try {
        setLoadingCottage(true);

        const detail = await getCottageDetail(
          selected!.databaseId!,
          controller.signal,
        );

        setCottageDetail(detail);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
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
          Select a cottage or resort location directly
          from the property map.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
                Select a cottage or resort amenity to
                explore more information.
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
                  <div className="mt-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-950">
                        Rooms
                      </h4>

                      <span className="text-xs text-slate-500">
                        {cottageDetail.rooms.length} available
                        spaces
                      </span>
                    </div>

                    {cottageDetail.rooms.map(
                      (room) => (
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

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {room.code}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Capacity
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-800">
                                {room.capacity === null
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
                        </div>
                      ),
                    )}

                    <button
                      type="button"
                      disabled
                      className="mt-4 w-full cursor-not-allowed rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white opacity-60"
                    >
                      Check availability
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      Booking availability will be enabled
                      in the next phase.
                    </p>
                  </div>
                )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}