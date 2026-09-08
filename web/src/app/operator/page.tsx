import OperatorDailyOperations from "@/components/operator/OperatorDailyOperations";
import OperatorReservationQueue from "@/components/operator/OperatorReservationQueue";

export default function OperatorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Sea Waves Chalet
            </p>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Local development
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Operator Control Center
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage daily resort
            operations,
            reservations,
            arrivals, departures
            and guest stays.
          </p>
        </header>

        <div className="space-y-10">
          <OperatorDailyOperations />

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Reservation
                Management
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                All reservations
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Review booking
                requests and manage
                reservation
                lifecycle status.
              </p>
            </div>

            <OperatorReservationQueue />
          </section>
        </div>
      </div>
    </main>
  );
}