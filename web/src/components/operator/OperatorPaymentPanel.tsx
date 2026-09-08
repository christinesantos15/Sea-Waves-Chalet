"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getReservationPayments,
  recordReservationPayment,
  updateReservationAmount,
  type OperatorPaymentSummary,
} from "@/lib/operatorApi";

type OperatorPaymentPanelProps = {
  reservationId: number;
};

function formatMoney(
  value: string,
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₱0.00";
  }

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    },
  ).format(amount);
}

function formatPaymentDate(
  value: string | null,
) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function paymentStatusClasses(
  status:
    | "unpriced"
    | "unpaid"
    | "partial"
    | "paid",
) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";

    case "partial":
      return "bg-amber-100 text-amber-800";

    case "unpaid":
      return "bg-red-100 text-red-700";

    case "unpriced":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function OperatorPaymentPanel({
  reservationId,
}: OperatorPaymentPanelProps) {
  const [summary, setSummary] =
    useState<OperatorPaymentSummary | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [totalAmount, setTotalAmount] =
    useState("");

  const [savingAmount, setSavingAmount] =
    useState(false);

  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentType, setPaymentType] =
    useState<
      | "deposit"
      | "balance"
      | "full"
      | "other"
    >("deposit");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");

  const [paymentNotes, setPaymentNotes] =
    useState("");

  const [savingPayment, setSavingPayment] =
    useState(false);

  const loadSummary =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getReservationPayments(
            reservationId,
          );

        setSummary(result);

        setTotalAmount(
          result.total_amount === "0.00"
            ? ""
            : result.total_amount,
        );
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Could not load payment information.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, [reservationId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function handleAmountUpdate() {
    const amount =
      Number(totalAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError(
        "Enter a valid booking total.",
      );

      return;
    }

    try {
      setSavingAmount(true);
      setError(null);

      const result =
        await updateReservationAmount(
          reservationId,
          amount.toFixed(2),
        );

      setSummary(result);

      setTotalAmount(
        result.total_amount,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Could not update booking total.",
        );
      }
    } finally {
      setSavingAmount(false);
    }
  }

  async function handleRecordPayment() {
    const amount =
      Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Enter a valid payment amount.",
      );

      return;
    }

    try {
      setSavingPayment(true);
      setError(null);

      const result =
        await recordReservationPayment(
          reservationId,
          {
            amount:
              amount.toFixed(2),

            payment_type:
              paymentType,

            payment_method:
              paymentMethod.trim() ||
              null,

            reference:
              paymentReference.trim() ||
              null,

            notes:
              paymentNotes.trim() ||
              null,
          },
        );

      setSummary(result);

      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");

      setShowPaymentForm(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Could not record payment.",
        );
      }
    } finally {
      setSavingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Loading payment details...
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">
          {error ??
            "Payment information could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Payments
          </p>

          <h4 className="mt-1 text-lg font-semibold text-slate-950">
            Booking payment
          </h4>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStatusClasses(
            summary.payment_status,
          )}`}
        >
          {summary.payment_status}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Booking total
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-950">
            {summary.payment_status ===
            "unpriced"
              ? "Not set"
              : formatMoney(
                  summary.total_amount,
                )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Paid
          </p>

          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {formatMoney(
              summary.paid_amount,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Balance
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-950">
            {formatMoney(
              summary.balance,
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Booking total
          </span>

          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₱
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(event) =>
                  setTotalAmount(
                    event.target.value,
                  )
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-7 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                void handleAmountUpdate()
              }
              disabled={savingAmount}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingAmount
                ? "Saving..."
                : "Set total"}
            </button>
          </div>
        </label>
      </div>

      {summary.payment_status !==
        "unpriced" &&
        summary.payment_status !==
          "paid" && (
          <div className="mt-4">
            {!showPaymentForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(
                    true,
                  );

                  setPaymentAmount(
                    summary.balance,
                  );
                }}
                className="w-full rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Record payment
              </button>
            ) : (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                <h5 className="font-semibold text-slate-950">
                  Record payment
                </h5>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Amount
                    </span>

                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₱
                      </span>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          paymentAmount
                        }
                        onChange={(
                          event,
                        ) =>
                          setPaymentAmount(
                            event.target
                              .value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Payment type
                    </span>

                    <select
                      value={paymentType}
                      onChange={(
                        event,
                      ) =>
                        setPaymentType(
                          event.target
                            .value as
                            | "deposit"
                            | "balance"
                            | "full"
                            | "other",
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                    >
                      <option value="deposit">
                        Deposit
                      </option>

                      <option value="balance">
                        Balance
                      </option>

                      <option value="full">
                        Full payment
                      </option>

                      <option value="other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Payment method
                    </span>

                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(
                        event,
                      ) =>
                        setPaymentMethod(
                          event.target
                            .value,
                        )
                      }
                      placeholder="GCash, cash, bank transfer..."
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Payment reference
                    </span>

                    <input
                      type="text"
                      value={
                        paymentReference
                      }
                      onChange={(
                        event,
                      ) =>
                        setPaymentReference(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Optional transaction reference"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Notes
                    </span>

                    <textarea
                      rows={2}
                      value={paymentNotes}
                      onChange={(
                        event,
                      ) =>
                        setPaymentNotes(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Optional payment notes"
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                    />
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={
                        savingPayment
                      }
                      onClick={() =>
                        void handleRecordPayment()
                      }
                      className="flex-1 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50"
                    >
                      {savingPayment
                        ? "Recording..."
                        : "Save payment"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        savingPayment
                      }
                      onClick={() =>
                        setShowPaymentForm(
                          false,
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-slate-950">
            Payment history
          </h5>

          <span className="text-xs text-slate-500">
            {summary.payments.length}{" "}
            {summary.payments.length === 1
              ? "payment"
              : "payments"}
          </span>
        </div>

        {summary.payments.length === 0 ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              No payments recorded yet.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {summary.payments.map(
              (payment) => (
                <div
                  key={payment.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {formatMoney(
                          payment.amount,
                        )}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {
                          payment.payment_type
                        }
                        {payment.payment_method
                          ? ` · ${payment.payment_method}`
                          : ""}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-800">
                      {payment.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {formatPaymentDate(
                      payment.paid_at,
                    )}
                  </p>

                  {payment.reference && (
                    <p className="mt-2 text-xs text-slate-600">
                      Reference:{" "}
                      <span className="font-medium">
                        {
                          payment.reference
                        }
                      </span>
                    </p>
                  )}

                  {payment.notes && (
                    <p className="mt-2 text-sm text-slate-600">
                      {payment.notes}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}