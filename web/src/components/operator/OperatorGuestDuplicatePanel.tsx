"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type OperatorGuest,
  type OperatorGuestDuplicateCandidate,
  getOperatorGuestDuplicates,
  mergeOperatorGuests,
} from "@/lib/operatorGuestApi";


type Props = {
  onSelectGuest: (
    guestId: number,
  ) => void;

  onMergeComplete?: (
    canonicalGuestId: number,
  ) => void;
};


type MergeSelection = {
  canonical: OperatorGuest;
  duplicate: OperatorGuest;
} | null;


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

  if (field === "facebook_name") {
    return "Same Facebook name";
  }

  if (field === "messenger_psid") {
    return "Same Messenger identity";
  }

  return field;
}


export default function OperatorGuestDuplicatePanel({
  onSelectGuest,
  onMergeComplete,
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
  ] = useState<string | null>(
    null,
  );

  const [
    mergeSelection,
    setMergeSelection,
  ] = useState<MergeSelection>(
    null,
  );

  const [
    merging,
    setMerging,
  ] = useState(false);

  const [
    mergeError,
    setMergeError,
  ] = useState<string | null>(
    null,
  );

  const [
    mergeResult,
    setMergeResult,
  ] = useState<string | null>(
    null,
  );


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


  function prepareMerge(
    canonical: OperatorGuest,
    duplicate: OperatorGuest,
  ) {
    setMergeError(null);
    setMergeResult(null);

    setMergeSelection({
      canonical,
      duplicate,
    });
  }


  async function confirmMerge() {
    if (!mergeSelection) {
      return;
    }

    setMerging(true);
    setMergeError(null);

    try {
      const result =
        await mergeOperatorGuests(
          mergeSelection
            .canonical.id,
          mergeSelection
            .duplicate.id,
        );

      const canonicalId =
        result.canonical_guest.id;

      setMergeResult(
        `Merged guest #${result.merged_guest_id}. ` +
          `${result.moved_inquiries} inquiries and ` +
          `${result.moved_reservations} reservations moved.`,
      );

      setMergeSelection(null);

      await loadDuplicates();

      onMergeComplete?.(
        canonicalId,
      );
    } catch (err) {
      setMergeError(
        errorMessage(err),
      );
    } finally {
      setMerging(false);
    }
  }


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
          Could not check duplicate guests
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


  return (
    <section className="mt-6 space-y-4">
      {mergeResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Guest merge completed
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            {mergeResult}
          </p>
        </div>
      )}


      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-800">
            No possible duplicates
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            No guest records currently
            share the identity fields
            being checked.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                Identity Review
              </p>

              <h3 className="mt-1 text-lg font-semibold text-amber-950">
                Possible duplicate guests
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800">
                Review both records and
                choose which guest record
                should remain.
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
                  key={
                    `${candidate.guest_a.id}-` +
                    `${candidate.guest_b.id}`
                  }
                  className="rounded-xl border border-amber-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Candidate #{index + 1}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {candidate.matches.map(
                        (match) => (
                          <span
                            key={match.field}
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
                                {guest.full_name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Guest #{guest.id}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onSelectGuest(
                                  guest.id,
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Open
                            </button>
                          </div>

                          <div className="mt-4 space-y-1.5 text-sm text-slate-600">
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


                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        prepareMerge(
                          candidate.guest_a,
                          candidate.guest_b,
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      Keep #
                      {candidate.guest_a.id},
                      merge #
                      {candidate.guest_b.id}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        prepareMerge(
                          candidate.guest_b,
                          candidate.guest_a,
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      Keep #
                      {candidate.guest_b.id},
                      merge #
                      {candidate.guest_a.id}
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      )}


      {mergeSelection && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
            Confirm Guest Merge
          </p>

          <h3 className="mt-2 text-xl font-semibold text-rose-950">
            Merge guest #
            {
              mergeSelection
                .duplicate.id
            }{" "}
            into guest #
            {
              mergeSelection
                .canonical.id
            }?
          </h3>


          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Keep
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {
                  mergeSelection
                    .canonical
                    .full_name
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Guest #
                {
                  mergeSelection
                    .canonical.id
                }
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {
                  mergeSelection
                    .canonical
                    .inquiry_count
                }{" "}
                inquiries ·{" "}
                {
                  mergeSelection
                    .canonical
                    .reservation_count
                }{" "}
                reservations
              </p>
            </div>


            <div className="rounded-xl border border-rose-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Merge & remove
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {
                  mergeSelection
                    .duplicate
                    .full_name
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Guest #
                {
                  mergeSelection
                    .duplicate.id
                }
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {
                  mergeSelection
                    .duplicate
                    .inquiry_count
                }{" "}
                inquiries ·{" "}
                {
                  mergeSelection
                    .duplicate
                    .reservation_count
                }{" "}
                reservations
              </p>
            </div>
          </div>


          <div className="mt-4 rounded-xl border border-rose-200 bg-white p-4 text-sm leading-6 text-rose-800">
            All inquiries and
            reservations belonging to
            guest #
            {
              mergeSelection
                .duplicate.id
            }{" "}
            will move to guest #
            {
              mergeSelection
                .canonical.id
            }.
            The duplicate record will
            then be removed.
          </div>


          {mergeError && (
            <div className="mt-4 rounded-xl border border-rose-300 bg-white p-3 text-sm text-rose-700">
              {mergeError}
            </div>
          )}


          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={merging}
              onClick={() =>
                void confirmMerge()
              }
              className="rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {merging
                ? "Merging..."
                : `Confirm merge into #${mergeSelection.canonical.id}`}
            </button>

            <button
              type="button"
              disabled={merging}
              onClick={() => {
                setMergeSelection(
                  null,
                );
                setMergeError(null);
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
