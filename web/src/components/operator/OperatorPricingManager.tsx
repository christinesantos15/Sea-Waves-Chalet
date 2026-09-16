"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type ExtraCharge,
  type RoomTypePricing,
  getExtraCharges,
  getRoomTypes,
  updateExtraCharge,
  updateRoomRate,
  updateRoomType,
} from "@/lib/operatorPricingApi";


function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}


function peso(
  value: string | number,
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}


function rateLabel(
  value: string,
): string {
  if (
    value === "with_breakfast"
  ) {
    return "With breakfast";
  }

  if (
    value === "without_breakfast"
  ) {
    return "Without breakfast";
  }

  return value;
}


export default function OperatorPricingManager() {
  const [
    roomTypes,
    setRoomTypes,
  ] = useState<
    RoomTypePricing[]
  >([]);

  const [
    extraCharges,
    setExtraCharges,
  ] = useState<
    ExtraCharge[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    savingKey,
    setSavingKey,
  ] = useState<string | null>(
    null,
  );

  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  );


  const loadPricing =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const [
            roomTypeData,
            chargeData,
          ] = await Promise.all([
            getRoomTypes(),
            getExtraCharges(),
          ]);

          setRoomTypes(
            roomTypeData,
          );

          setExtraCharges(
            chargeData,
          );
        } catch (err) {
          setError(
            errorMessage(err),
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadPricing();
  }, [
    loadPricing,
  ]);


  async function saveRoomType(
    event: FormEvent<HTMLFormElement>,
    roomType: RoomTypePricing,
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget,
      );

    const name =
      String(
        form.get("name") ?? "",
      ).trim();

    const capacity =
      Number(
        form.get("capacity"),
      );

    const key =
      `room-type-${roomType.id}`;

    setSavingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const updated =
        await updateRoomType(
          roomType.id,
          {
            name,
            capacity,
            is_active:
              roomType.is_active,
          },
        );

      setRoomTypes(
        (current) =>
          current.map(
            (item) =>
              item.id === updated.id
                ? updated
                : item,
          ),
      );

      setSuccess(
        `${updated.name} updated.`,
      );
    } catch (err) {
      setError(
        errorMessage(err),
      );
    } finally {
      setSavingKey(null);
    }
  }


  async function saveRate(
    event: FormEvent<HTMLFormElement>,
    roomType: RoomTypePricing,
    rateId: number,
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget,
      );

    const amount =
      Number(
        form.get("amount"),
      );

    const key =
      `rate-${rateId}`;

    setSavingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const updated =
        await updateRoomRate(
          roomType.id,
          rateId,
          {
            amount,
          },
        );

      setRoomTypes(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              roomType.id
                ? {
                    ...item,
                    rates:
                      item.rates.map(
                        (rate) =>
                          rate.id ===
                          updated.id
                            ? updated
                            : rate,
                      ),
                  }
                : item,
          ),
      );

      setSuccess(
        "Room rate updated.",
      );
    } catch (err) {
      setError(
        errorMessage(err),
      );
    } finally {
      setSavingKey(null);
    }
  }


  async function saveCharge(
    event: FormEvent<HTMLFormElement>,
    charge: ExtraCharge,
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget,
      );

    const name =
      String(
        form.get("name") ?? "",
      ).trim();

    const amount =
      Number(
        form.get("amount"),
      );

    const key =
      `charge-${charge.id}`;

    setSavingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const updated =
        await updateExtraCharge(
          charge.id,
          {
            name,
            amount,
            is_active:
              charge.is_active,
          },
        );

      setExtraCharges(
        (current) =>
          current.map(
            (item) =>
              item.id === updated.id
                ? updated
                : item,
          ),
      );

      setSuccess(
        `${updated.name} updated.`,
      );
    } catch (err) {
      setError(
        errorMessage(err),
      );
    } finally {
      setSavingKey(null);
    }
  }


  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">
          Loading pricing...
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Accommodation
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Room types & rates
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            These are the current
            published room-type prices.
            Physical cottages and rooms
            are not assigned to these
            types yet.
          </p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {roomTypes.map(
            (roomType) => (
              <article
                key={roomType.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <form
                  onSubmit={(
                    event,
                  ) =>
                    void saveRoomType(
                      event,
                      roomType,
                    )
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Room type
                      </span>

                      <input
                        name="name"
                        defaultValue={
                          roomType.name
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Capacity
                      </span>

                      <input
                        name="capacity"
                        type="number"
                        min="1"
                        defaultValue={
                          roomType.capacity
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {roomType.code}
                    </span>

                    <button
                      type="submit"
                      disabled={
                        savingKey ===
                        `room-type-${roomType.id}`
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Save details
                    </button>
                  </div>
                </form>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  {roomType.rates.map(
                    (rate) => (
                      <form
                        key={
                          rate.id
                        }
                        onSubmit={(
                          event,
                        ) =>
                          void saveRate(
                            event,
                            roomType,
                            rate.id,
                          )
                        }
                        className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <label className="min-w-[180px] flex-1">
                          <span className="text-xs font-semibold text-slate-600">
                            {rateLabel(
                              rate.rate_plan,
                            )}
                          </span>

                          <input
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={
                              Number(
                                rate.amount,
                              )
                            }
                            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={
                            savingKey ===
                            `rate-${rate.id}`
                          }
                          className="rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                        >
                          Save
                        </button>

                        <span className="w-full text-xs text-slate-400">
                          Current:{" "}
                          {peso(
                            rate.amount,
                          )}
                        </span>
                      </form>
                    ),
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Additional charges
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Extra charges
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Current additional charges
            communicated to guests.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {extraCharges.map(
            (charge) => (
              <form
                key={charge.id}
                onSubmit={(
                  event,
                ) =>
                  void saveCharge(
                    event,
                    charge,
                  )
                }
                className="rounded-2xl border border-slate-200 p-5"
              >
                <label>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Charge name
                  </span>

                  <input
                    name="name"
                    defaultValue={
                      charge.name
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </span>

                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      Number(
                        charge.amount,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </label>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {peso(
                      charge.amount,
                    )}
                  </span>

                  <button
                    type="submit"
                    disabled={
                      savingKey ===
                      `charge-${charge.id}`
                    }
                    className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </form>
            ),
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">
          Physical room assignment is intentionally pending.
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          C01–C12 / R1–R2 remain
          unassigned until the actual
          resort room mapping is
          confirmed.
        </p>
      </div>
    </div>
  );
}
