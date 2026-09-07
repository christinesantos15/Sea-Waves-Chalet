import PropertyMap from "@/components/property-map/PropertyMap";
import { propertyMapLocations } from "@/data/propertyMap";

export default function MapEditorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Sea Waves Chalet
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-slate-950">
            Property Map Editor
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Internal positioning tool for resort locations.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <PropertyMap locations={propertyMapLocations} />
      </div>
    </main>
  );
}