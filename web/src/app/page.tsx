import CustomerPropertyMap from "@/components/customer-map/CustomerPropertyMap";
import { propertyMapLocations } from "@/data/propertyMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7fbfc]">
      <header className="border-b border-white/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              Sea Waves
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              Chalet & Beach Resort
            </p>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#explore" className="transition hover:text-slate-950">
              Explore
            </a>

            <a href="#stay" className="transition hover:text-slate-950">
              Stay
            </a>

            <a href="#contact" className="transition hover:text-slate-950">
              Contact
            </a>

            <button
              type="button"
              className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-slate-800"
            >
              Book your stay
            </button>
          </nav>
        </div>
      </header>

      <section className="border-b border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Beachside stays · gatherings · getaways
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Your stay, mapped out before you arrive.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Discover the Sea Waves Chalet property through
            an interactive resort map and find the spaces
            that fit your stay.
          </p>
        </div>
      </section>

      <section
        id="explore"
        className="mx-auto max-w-7xl px-6 py-14 sm:py-20"
      >
        <CustomerPropertyMap
          locations={propertyMapLocations}
        />
      </section>
    </main>
  );
}