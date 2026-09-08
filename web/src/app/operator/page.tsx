import OperatorReservationQueue from "@/components/operator/OperatorReservationQueue";

export default function OperatorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
              Sea Waves
            </p>

            <h1 className="mt-1 text-xl font-semibold text-slate-950">
              Operator Control Center
            </h1>
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
            Local development
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-medium text-sky-700">
            Reservations
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Booking requests
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Review website booking requests,
            confirm valid reservations, and
            decline requests that cannot be
            accepted.
          </p>
        </div>

        <OperatorReservationQueue />
      </div>
    </main>
  );
}