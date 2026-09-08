"use client";

import { useState } from "react";

import type { PropertyMapLocation } from "@/components/property-map/types";

type CustomerPropertyMapProps = {
  locations: PropertyMapLocation[];
};

export default function CustomerPropertyMap({
  locations,
}: CustomerPropertyMapProps) {
  const [selected, setSelected] =
    useState<PropertyMapLocation | null>(null);

  return (
    <section className="relative">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          Discover the resort
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Explore Sea Waves Chalet
        </h2>

        <p className="mt-3 text-base leading-7 text-slate-600">
          Explore the property, discover resort amenities,
          and soon choose your cottage directly from the map.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setSelected(location)}
                  style={{
                    left: `${location.x}%`,
                    top: `${location.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition-all duration-200 ${
                    isSelected
                      ? "scale-105 border-white bg-sky-600 text-white ring-4 ring-sky-200/60"
                      : "border-white/80 bg-white/85 text-slate-900 hover:-translate-y-[55%] hover:bg-white"
                  }`}
                >
                  {location.name}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          {selected ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Resort Location
              </p>

              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                {selected.name}
              </h3>

              {selected.type === "cottage" &&
                selected.status && (
                    <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                    {selected.status}
                    </span>
                )}

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selected.description}
              </p>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                  More information, photos, and guest details
                  will appear here as we build the booking
                  experience.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Interactive Map
              </p>

              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                Choose a location
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select a label on the resort map to explore
                that part of Sea Waves Chalet.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}