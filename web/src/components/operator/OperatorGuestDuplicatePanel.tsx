"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type OperatorGuestDuplicateCandidate,
  getOperatorGuestDuplicates,
} from "@/lib/operatorGuestApi";


type Props = {
  onSelectGuest: (
    guestId: number,
  ) => void;
};


function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}


function matchLabel(
  field: string,
): string {
  if (field === "phone") {
    return "Same phone";
  }

  if (field === "email") {
    return "Same email";
  }

  if (
    field === "facebook_name"
  ) {
    return "Same Facebook name";
  }

  if (
    field === "messenger_psid"
  ) {
    return "Same Messenger identity";
  }

  return field;
}


export default function OperatorGuestDuplicatePanel({
  onSelectGuest,
}: Props) {
  const [
    candidates,
    setCandidates,
  ] = useState<
    OperatorGuestDuplicateCandidate[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const loadDuplicates =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const data =
            await getOperatorGuestDuplicates();

          setCandidates(data);
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
    void loadDuplicates();
  }, [
    loadDuplicates,
  ]);


  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">
          Checking guest identities...
        </p>
      </section>
    );
  }


  if (error) {
    return (
      <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <p className="font-semibold text-rose-800">
          Could not check duplicate
          guests
        </p>

        <p className="mt-1 text-sm text-rose-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void loadDuplicates()
          }
          className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </section>
    );
  }


  if (
    candidates.length === 0
  ) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-800">
          No possible duplicates
        </p>

        <p className="mt-1 text-sm text-emerald-700">
          No guest records currently
          share the identity fields we
          check.
        </p>
      </section>
    );
  }


  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Identity Review
          </p>

          <h3 className="mt-1 text-lg font-semibold text-amber-950">
            Possible duplicate guests
          </h3>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800">
            These records share one or
            more contact identities.
            Review them before any
            records are combined.
          </p>
        </div>

        <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-semibold text-amber-800">
          {candidates.length}
        </span>
      </div>


      <div className="mt-5 space-y-4">
        {candidates.map(
          (
            candidate,
            index,
          ) => (
            <article
              key={`${candidate.guest_a.id}-${candidate.guest_b.id}`}
              className="rounded-xl border border-amber-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Candidate #
                  {index + 1}
                </p>

                <div className="flex flex-wrap gap-2">
                  {candidate.matches.map(
                    (match) => (
                      <span
                        key={
                          match.field
                        }
                        className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                      >
                        {matchLabel(
                          match.field,
                        )}
                      </span>
                    ),
                  )}
                </div>
              </div>


              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  candidate.guest_a,
                  candidate.guest_b,
                ].map(
                  (guest) => (
                    <div
                      key={guest.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {
                              guest.full_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Guest #
                            {guest.id}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onSelectGuest(
                              guest.id,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Open
                        </button>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>
                          Phone:{" "}
                          {guest.phone ??
                            "Not provided"}
                        </p>

                        <p>
                          Email:{" "}
                          {guest.email ??
                            "Not provided"}
                        </p>

                        <p>
                          Inquiries:{" "}
                          {
                            guest.inquiry_count
                          }
                        </p>

                        <p>
                          Reservations:{" "}
                          {
                            guest.reservation_count
                          }
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>


              <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-800">
                  Matching values
                </p>

                <div className="mt-1 space-y-1">
                  {candidate.matches.map(
                    (match) => (
                      <p
                        key={
                          match.field
                        }
                        className="break-all text-xs text-amber-700"
                      >
                        {matchLabel(
                          match.field,
                        )}
                        :{" "}
                        {
                          match.value
                        }
                      </p>
                    ),
                  )}
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
