"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { PropertyMapLocation } from "./types";

type PropertyMapProps = {
  locations: PropertyMapLocation[];
};

const STORAGE_KEY = "sea-waves-map-calibration-v3";

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function PropertyMap({
  locations,
}: PropertyMapProps) {
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);

  const [mapLocations, setMapLocations] =
    useState<PropertyMapLocation[]>(locations);

  const [selectedId, setSelectedId] = useState<string | null>(
    null,
  );

  const [draggingId, setDraggingId] = useState<string | null>(
    null,
  );

  const [calibrationLoaded, setCalibrationLoaded] =
    useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const savedLocations = JSON.parse(
          saved,
        ) as PropertyMapLocation[];

        setMapLocations(savedLocations);
      } catch {
        // Ignore invalid saved map data.
      }
    }

    setCalibrationLoaded(true);
  }, []);

  useEffect(() => {
    if (!calibrationLoaded) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mapLocations),
    );
  }, [mapLocations, calibrationLoaded]);

  const selectedLocation = useMemo(
    () =>
      mapLocations.find(
        (location) => location.id === selectedId,
      ) ?? null,
    [mapLocations, selectedId],
  );

  const cottageCount = mapLocations.filter(
    (location) => location.type === "cottage",
  ).length;

  function updateMarkerPosition(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (!draggingId || !mapCanvasRef.current) {
      return;
    }

    const bounds =
      mapCanvasRef.current.getBoundingClientRect();

    const x =
      ((event.clientX - bounds.left) / bounds.width) * 100;

    const y =
      ((event.clientY - bounds.top) / bounds.height) * 100;

    setMapLocations((current) =>
      current.map((location) =>
        location.id === draggingId
          ? {
              ...location,
              x: Number(clamp(x).toFixed(2)),
              y: Number(clamp(y).toFixed(2)),
            }
          : location,
      ),
    );
  }

  function handleMarkerPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    id: string,
  ) {
    event.preventDefault();
    event.stopPropagation();

    setSelectedId(id);
    setDraggingId(id);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  function addCottage() {
    const number = cottageCount + 1;

    const newCottage: PropertyMapLocation = {
      id: `draft-cottage-${Date.now()}`,
      name: `Unassigned Cottage ${number}`,
      type: "cottage",
      description:
        "Temporary cottage marker. Final name and property details still need to be confirmed.",
      x: 50,
      y: 50,
      isDraft: true,
    };

    setMapLocations((current) => [
      ...current,
      newCottage,
    ]);

    setSelectedId(newCottage.id);
  }

  function deleteSelectedCottage() {
    if (
      !selectedLocation ||
      selectedLocation.type !== "cottage" ||
      !selectedLocation.isDraft
    ) {
      return;
    }

    setMapLocations((current) =>
      current.filter(
        (location) =>
          location.id !== selectedLocation.id,
      ),
    );

    setSelectedId(null);
  }

  function resetCalibration() {
    window.localStorage.removeItem(STORAGE_KEY);

    setMapLocations(locations);
    setSelectedId(null);
    setDraggingId(null);
  }

  async function copyCoordinates() {
    const text = mapLocations
      .map(
        (location) =>
          `${location.name}: x ${location.x}, y ${location.y}`,
      )
      .join("\n");

    await navigator.clipboard.writeText(text);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Interactive Property Map
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Sea Waves Map Editor
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Position confirmed resort areas and map the
            actual cottages.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addCottage}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            + Add cottage
          </button>

          <button
            type="button"
            onClick={copyCoordinates}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {copied ? "Copied" : "Copy positions"}
          </button>

          <button
            type="button"
            onClick={resetCalibration}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <div>
          <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-6 shadow-sm">
            <div
              ref={mapCanvasRef}
              onPointerMove={updateMarkerPosition}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative mx-auto touch-none"
            >
              <img
                src="/resort/sea-waves-map.png"
                alt="Top view of Sea Waves Chalet resort property"
                draggable={false}
                className="block h-auto w-full select-none object-contain"
              />

              {mapLocations.map((location) => {
                const selected =
                  selectedId === location.id;

                const isCottage =
                  location.type === "cottage";

                return (
                  <button
                    key={location.id}
                    type="button"
                    onPointerDown={(event) =>
                      handleMarkerPointerDown(
                        event,
                        location.id,
                      )
                    }
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab whitespace-nowrap border text-xs font-semibold shadow-lg backdrop-blur transition active:cursor-grabbing ${
                      isCottage
                        ? "rounded-lg px-2.5 py-1"
                        : "rounded-full px-3 py-1.5"
                    } ${
                      selected
                        ? "border-white bg-sky-600 text-white ring-4 ring-sky-200/70"
                        : isCottage
                          ? "border-emerald-200 bg-emerald-600/90 text-white hover:bg-emerald-700"
                          : "border-white/80 bg-slate-950/85 text-white hover:scale-105"
                    }`}
                    style={{
                      left: `${location.x}%`,
                      top: `${location.y}%`,
                    }}
                  >
                    {location.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">
                Calibration mode
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Drag each marker directly over the matching
                structure.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-950">
                {cottageCount} cottage markers
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Add only the cottages you can identify on the
                real property image.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedLocation ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                Selected Location
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedLocation.name}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selectedLocation.description}
              </p>

              {selectedLocation.isDraft && (
                <div className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Draft cottage
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    X position
                  </p>

                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                    {selectedLocation.x}%
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Y position
                  </p>

                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                    {selectedLocation.y}%
                  </p>
                </div>
              </div>

              {selectedLocation.type === "cottage" &&
                selectedLocation.isDraft && (
                  <button
                    type="button"
                    onClick={deleteSelectedCottage}
                    className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Delete this cottage marker
                  </button>
                )}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                Map Editor
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Map the actual cottages
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use Add cottage, then drag the new marker
                directly onto one of the black-roof cottage
                structures.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}