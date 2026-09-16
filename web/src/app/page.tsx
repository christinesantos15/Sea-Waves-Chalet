import CustomerPropertyMap from "@/components/customer-map/CustomerPropertyMap";
import PublicPricingSection from "@/components/public/PublicPricingSection";
import RoomTypeBookingSection from "@/components/public/RoomTypeBookingSection";
import ReservationStatusSection from "@/components/public/ReservationStatusSection";
import { getPublicPricing } from "@/lib/publicPricingApi";
import { getPropertyMapLocations } from "@/lib/resortApi";


export default async function Home() {
  const [
    locations,
    pricing,
  ] = await Promise.all([
    getPropertyMapLocations(),
    getPublicPricing(),
  ]);

  return (
    <main className="min-h-screen bg-[#f7fafb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <a
            href="#top"
            className="group"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-700">
              Sea Waves
            </p>

            <p className="mt-0.5 text-base font-semibold tracking-tight text-slate-950">
              Chalet & Beach Resort
            </p>
          </a>

          <nav className="flex items-center gap-3 sm:gap-7">
            <a
              href="#explore"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
            >
              Explore
            </a>

            <a
              href="#rates"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
            >
              Rates
            </a>

            <a
              href="#stay"
              className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block"
            >
              Stay
            </a>

            <a
              href="#book"
              className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:px-5"
            >
              Book your stay
            </a>
          </nav>
        </div>
      </header>

      <section
        id="top"
        className="relative overflow-hidden border-b border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="absolute -bottom-48 left-1/4 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-sky-700">
              Beachside stays · gatherings · getaways
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Find your place at
              Sea Waves before you
              arrive.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Explore the resort from
              above, compare current
              room types and rates,
              then send your reservation
              request in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#explore"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Explore the resort
              </a>

              <a
                href="#stay"
                className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
              >
                How booking works
              </a>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["12", "Cottages"],
              ["24", "Rooms"],
              ["1", "Swimming pool"],
              ["Beach", "Access"],
            ].map(
              ([value, label]) => (
                <div
                  key={`${value}-${label}`}
                  className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xl font-semibold text-slate-950">
                    {value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {label}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="explore"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20"
      >
        <CustomerPropertyMap
          locations={locations}
        />
      </section>

      <PublicPricingSection
        roomTypes={pricing.roomTypes}
        extraCharges={pricing.extraCharges}
      />

      <RoomTypeBookingSection
        roomTypes={pricing.roomTypes}
      />

      <ReservationStatusSection />

      <section
        id="stay"
        className="border-t border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Simple reservation process
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              From room type to
              reservation request.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [
                "01",
                "Choose a room type",
                "Compare the resort's room types, guest capacities, and current published rates.",
              ],
              [
                "02",
                "Choose dates and rate",
                "Enter your stay dates and choose whether you want a room-only or breakfast rate.",
              ],
              [
                "03",
                "Send your request",
                "Send your contact details. The resort reviews the request and assigns the exact cottage and room before confirmation.",
              ],
            ].map(
              ([
                number,
                title,
                description,
              ]) => (
                <div
                  key={number}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-6"
                >
                  <span className="text-xs font-bold tracking-[0.18em] text-sky-700">
                    {number}
                  </span>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-white">
              Sea Waves Chalet &
              Beach Resort
            </p>

            <p className="mt-1">
              Resort booking and
              property exploration.
            </p>
          </div>

          <a
            href="#top"
            className="font-medium text-slate-300 transition hover:text-white"
          >
            Back to top ↑
          </a>
        </div>
      </footer>
    </main>
  );
}
