import type {
  PublicExtraCharge,
  PublicRoomRate,
  PublicRoomTypePricing,
} from "@/lib/publicPricingApi";


type Props = {
  roomTypes: PublicRoomTypePricing[];
  extraCharges: PublicExtraCharge[];
};


function peso(
  value: string | number,
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}


function findRate(
  rates: PublicRoomRate[],
  plan:
    | "with_breakfast"
    | "without_breakfast",
): PublicRoomRate | undefined {
  return rates.find(
    (rate) =>
      rate.rate_plan === plan,
  );
}


export default function PublicPricingSection({
  roomTypes,
  extraCharges,
}: Props) {
  return (
    <section
      id="rates"
      className="border-t border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Current resort pricing
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Find a room that fits
            your group.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Compare the resort&apos;s
            current room-type rates
            with or without breakfast.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roomTypes.map(
            (roomType) => {
              const roomOnly =
                findRate(
                  roomType.rates,
                  "without_breakfast",
                );

              const breakfast =
                findRate(
                  roomType.rates,
                  "with_breakfast",
                );

              return (
                <article
                  key={roomType.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-950/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {roomType.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Up to{" "}
                        {roomType.capacity}{" "}
                        {roomType.capacity ===
                        1
                          ? "guest"
                          : "guests"}
                      </p>
                    </div>

                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {
                        roomType.capacity
                      }{" "}
                      pax
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Room only
                      </p>

                      <p className="mt-1 text-xl font-semibold text-slate-950">
                        {roomOnly
                          ? peso(
                              roomOnly.amount,
                            )
                          : "To be confirmed"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Without breakfast
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        With breakfast
                      </p>

                      <p className="mt-1 text-xl font-semibold text-slate-950">
                        {breakfast
                          ? peso(
                              breakfast.amount,
                            )
                          : "To be confirmed"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>

        <div className="mt-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Additional charges
            </p>

            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Extra charges
            </h3>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {extraCharges.map(
              (charge) => (
                <div
                  key={charge.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                >
                  <p className="text-sm font-medium text-slate-600">
                    {charge.name}
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {peso(
                      charge.amount,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm leading-6 text-amber-900">
            Rates shown are the
            resort&apos;s current
            published room-type rates.
            Exact cottage and room
            assignment is confirmed by
            the resort during the
            reservation process.
          </p>
        </div>
      </div>
    </section>
  );
}
