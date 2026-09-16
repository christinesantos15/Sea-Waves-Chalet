"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type OperatorGuest,
  type OperatorGuestDetail,
  type OperatorGuestUpdate,
  getOperatorGuest,
  getOperatorGuests,
  updateOperatorGuest,
} from "@/lib/operatorGuestApi";


type GuestForm = {
  full_name: string;
  phone: string;
  email: string;
  facebook_name: string;
  messenger_psid: string;
  notes: string;
};


function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}


function displayValue(
  value: string | null,
): string {
  return value?.trim()
    ? value
    : "Not provided";
}


function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not provided";
  }

  const [year, month, day] =
    value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ),
  );
}


function formatDateTime(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}


function statusClass(
  status: string,
): string {
  if (
    status === "confirmed" ||
    status === "checked_in" ||
    status === "converted"
  ) {
    return (
      "border-emerald-200 " +
      "bg-emerald-50 " +
      "text-emerald-700"
    );
  }

  if (
    status === "pending" ||
    status === "new" ||
    status === "contacted"
  ) {
    return (
      "border-amber-200 " +
      "bg-amber-50 " +
      "text-amber-700"
    );
  }

  if (
    status === "declined" ||
    status === "cancelled" ||
    status === "closed"
  ) {
    return (
      "border-rose-200 " +
      "bg-rose-50 " +
      "text-rose-700"
    );
  }

  if (
    status === "checked_out" ||
    status === "qualified"
  ) {
    return (
      "border-sky-200 " +
      "bg-sky-50 " +
      "text-sky-700"
    );
  }

  return (
    "border-slate-200 " +
    "bg-slate-50 " +
    "text-slate-700"
  );
}


function labelStatus(
  value: string,
): string {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function guestToForm(
  guest: OperatorGuestDetail,
): GuestForm {
  return {
    full_name:
      guest.full_name,
    phone:
      guest.phone ?? "",
    email:
      guest.email ?? "",
    facebook_name:
      guest.facebook_name ?? "",
    messenger_psid:
      guest.messenger_psid ?? "",
    notes:
      guest.notes ?? "",
  };
}


export default function OperatorGuestManager() {
  const [
    guests,
    setGuests,
  ] = useState<
    OperatorGuest[]
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

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedGuestId,
    setSelectedGuestId,
  ] = useState<
    number | null
  >(null);

  const [
    guestDetail,
    setGuestDetail,
  ] = useState<
    OperatorGuestDetail | null
  >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState<
    string | null
  >(null);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    editError,
    setEditError,
  ] = useState<
    string | null
  >(null);

  const [
    form,
    setForm,
  ] = useState<GuestForm>({
    full_name: "",
    phone: "",
    email: "",
    facebook_name: "",
    messenger_psid: "",
    notes: "",
  });


  const loadGuests =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const data =
            await getOperatorGuests({
              q:
                searchQuery ||
                undefined,
            });

          setGuests(data);
        } catch (err) {
          setError(
            errorMessage(err),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        searchQuery,
      ],
    );


  useEffect(() => {
    void loadGuests();
  }, [
    loadGuests,
  ]);


  async function openGuest(
    guestId: number,
  ) {
    setSelectedGuestId(
      guestId,
    );

    setDetailLoading(true);
    setDetailError(null);

    setEditing(false);
    setEditError(null);

    try {
      const data =
        await getOperatorGuest(
          guestId,
        );

      setGuestDetail(data);
      setForm(
        guestToForm(data),
      );
    } catch (err) {
      setGuestDetail(null);

      setDetailError(
        errorMessage(err),
      );
    } finally {
      setDetailLoading(false);
    }
  }


  function submitSearch(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSearchQuery(
      searchInput.trim(),
    );

    setSelectedGuestId(
      null,
    );

    setGuestDetail(null);
    setEditing(false);
  }


  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");

    setSelectedGuestId(
      null,
    );

    setGuestDetail(null);
    setEditing(false);
  }


  function beginEditing() {
    if (!guestDetail) {
      return;
    }

    setForm(
      guestToForm(
        guestDetail,
      ),
    );

    setEditError(null);
    setEditing(true);
  }


  function cancelEditing() {
    if (guestDetail) {
      setForm(
        guestToForm(
          guestDetail,
        ),
      );
    }

    setEditError(null);
    setEditing(false);
  }


  async function saveGuest(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!guestDetail) {
      return;
    }

    setSaving(true);
    setEditError(null);

    const payload:
      OperatorGuestUpdate = {
        full_name:
          form.full_name,

        phone:
          form.phone.trim()
            ? form.phone.trim()
            : null,

        email:
          form.email.trim()
            ? form.email.trim()
            : null,

        facebook_name:
          form.facebook_name.trim()
            ? form.facebook_name.trim()
            : null,

        messenger_psid:
          form.messenger_psid.trim()
            ? form.messenger_psid.trim()
            : null,

        notes:
          form.notes.trim()
            ? form.notes.trim()
            : null,
      };

    try {
      const updated =
        await updateOperatorGuest(
          guestDetail.id,
          payload,
        );

      setGuestDetail(
        updated,
      );

      setForm(
        guestToForm(updated),
      );

      setEditing(false);

      await loadGuests();
    } catch (err) {
      setEditError(
        errorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Guest Management
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Guest directory
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review guest contact
              information, notes,
              inquiries and reservation
              history.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs font-medium text-slate-500">
              Matching guests
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {guests.length}
            </p>
          </div>
        </div>


        <form
          onSubmit={
            submitSearch
          }
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            value={
              searchInput
            }
            onChange={(
              event,
            ) =>
              setSearchInput(
                event.target.value,
              )
            }
            placeholder="Search name, phone, email, Facebook or Messenger..."
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />

          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {(
            searchQuery ||
            searchInput
          ) && (
            <button
              type="button"
              onClick={
                clearSearch
              }
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>

        {searchQuery && (
          <div className="mt-3">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Search: {searchQuery}
            </span>
          </div>
        )}
      </div>


      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Guests
            </h3>

            {!loading && (
              <span className="text-xs text-slate-500">
                {guests.length} found
              </span>
            )}
          </div>


          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              Loading guests...
            </div>
          )}


          {!loading &&
            error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-800">
                  Could not load
                  guests
                </p>

                <p className="mt-1 text-sm text-rose-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadGuests()
                  }
                  className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            )}


          {!loading &&
            !error &&
            guests.length ===
              0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-semibold text-slate-800">
                  No guests found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try another search
                  or clear the search
                  field.
                </p>
              </div>
            )}


          {!loading &&
            !error &&
            guests.length >
              0 && (
              <div className="space-y-3">
                {guests.map(
                  (guest) => {
                    const selected =
                      guest.id ===
                      selectedGuestId;

                    return (
                      <button
                        key={
                          guest.id
                        }
                        type="button"
                        onClick={() =>
                          void openGuest(
                            guest.id,
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-sky-300 bg-sky-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">
                              {
                                guest.full_name
                              }
                            </p>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {guest.phone ??
                                guest.email ??
                                guest.facebook_name ??
                                "No contact details"}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            #
                            {
                              guest.id
                            }
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                            {
                              guest.inquiry_count
                            }{" "}
                            inquiries
                          </span>

                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                            {
                              guest.reservation_count
                            }{" "}
                            reservations
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
        </div>


        <div className="min-w-0">
          {selectedGuestId ===
            null && (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div>
                <p className="font-semibold text-slate-800">
                  Select a guest
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Choose a guest from
                  the directory to view
                  their profile,
                  inquiries and
                  reservation history.
                </p>
              </div>
            </div>
          )}


          {selectedGuestId !==
            null &&
            detailLoading && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Loading guest
                profile...
              </div>
            )}


          {selectedGuestId !==
            null &&
            !detailLoading &&
            detailError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <p className="font-semibold text-rose-800">
                  Could not load
                  guest profile
                </p>

                <p className="mt-2 text-sm text-rose-700">
                  {detailError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void openGuest(
                      selectedGuestId,
                    )
                  }
                  className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            )}


          {!detailLoading &&
            !detailError &&
            guestDetail && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        Guest Profile
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-slate-950">
                        {
                          guestDetail.full_name
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Guest #
                        {
                          guestDetail.id
                        }
                      </p>
                    </div>

                    {!editing && (
                      <button
                        type="button"
                        onClick={
                          beginEditing
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit guest
                      </button>
                    )}
                  </div>


                  {editing ? (
                    <form
                      onSubmit={
                        saveGuest
                      }
                      className="mt-6"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-slate-700">
                            Full name
                          </span>

                          <input
                            value={
                              form.full_name
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  full_name:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            required
                            maxLength={
                              150
                            }
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>


                        <label>
                          <span className="text-sm font-medium text-slate-700">
                            Phone
                          </span>

                          <input
                            value={
                              form.phone
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  phone:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            maxLength={
                              50
                            }
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>


                        <label>
                          <span className="text-sm font-medium text-slate-700">
                            Email
                          </span>

                          <input
                            type="email"
                            value={
                              form.email
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  email:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            maxLength={
                              255
                            }
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>


                        <label>
                          <span className="text-sm font-medium text-slate-700">
                            Facebook name
                          </span>

                          <input
                            value={
                              form.facebook_name
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  facebook_name:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            maxLength={
                              150
                            }
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>


                        <label>
                          <span className="text-sm font-medium text-slate-700">
                            Messenger PSID
                          </span>

                          <input
                            value={
                              form.messenger_psid
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  messenger_psid:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            maxLength={
                              255
                            }
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>


                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-slate-700">
                            Guest notes
                          </span>

                          <textarea
                            value={
                              form.notes
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  notes:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            rows={4}
                            className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </label>
                      </div>


                      {editError && (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {editError}
                        </div>
                      )}


                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={
                            saving
                          }
                          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving
                            ? "Saving..."
                            : "Save guest"}
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                          disabled={
                            saving
                          }
                          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Phone
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-slate-900">
                            {displayValue(
                              guestDetail.phone,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Email
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-slate-900">
                            {displayValue(
                              guestDetail.email,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Facebook
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-slate-900">
                            {displayValue(
                              guestDetail.facebook_name,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Messenger PSID
                          </p>

                          <p className="mt-1 break-all text-sm font-medium text-slate-900">
                            {displayValue(
                              guestDetail.messenger_psid,
                            )}
                          </p>
                        </div>
                      </div>


                      <div className="mt-4 rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {displayValue(
                            guestDetail.notes,
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </section>


                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        Inquiry History
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        Previous inquiries
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {
                        guestDetail.inquiry_count
                      }
                    </span>
                  </div>


                  {guestDetail.inquiries
                    .length ===
                  0 ? (
                    <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No inquiry history
                      for this guest.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {guestDetail.inquiries.map(
                        (
                          inquiry,
                        ) => (
                          <article
                            key={
                              inquiry.id
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  Inquiry #
                                  {
                                    inquiry.id
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDateTime(
                                    inquiry.created_at,
                                  )}
                                </p>
                              </div>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  inquiry.status,
                                )}`}
                              >
                                {labelStatus(
                                  inquiry.status,
                                )}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <span className="text-slate-500">
                                  Source:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {labelStatus(
                                    inquiry.source,
                                  )}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Guests:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {inquiry.guest_count ??
                                    "Not provided"}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Check-in:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {formatDate(
                                    inquiry.check_in,
                                  )}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Check-out:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {formatDate(
                                    inquiry.check_out,
                                  )}
                                </span>
                              </div>
                            </div>

                            {inquiry.message && (
                              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                                {
                                  inquiry.message
                                }
                              </p>
                            )}
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>


                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        Reservation History
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-slate-950">
                        Guest stays
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {
                        guestDetail.reservation_count
                      }
                    </span>
                  </div>


                  {guestDetail.reservations
                    .length ===
                  0 ? (
                    <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No reservation
                      history for this
                      guest.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {guestDetail.reservations.map(
                        (
                          reservation,
                        ) => (
                          <article
                            key={
                              reservation.id
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    reservation.reference
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Created{" "}
                                  {formatDateTime(
                                    reservation.created_at,
                                  )}
                                </p>
                              </div>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  reservation.status,
                                )}`}
                              >
                                {labelStatus(
                                  reservation.status,
                                )}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <span className="text-slate-500">
                                  Cottage:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  #
                                  {
                                    reservation.cottage_id
                                  }
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Room:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {reservation.room_id !==
                                  null
                                    ? `#${reservation.room_id}`
                                    : "Not assigned"}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Check-in:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {formatDate(
                                    reservation.check_in,
                                  )}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Check-out:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {formatDate(
                                    reservation.check_out,
                                  )}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Guests:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  {
                                    reservation.guest_count
                                  }
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Total:
                                </span>{" "}
                                <span className="font-medium text-slate-800">
                                  ₱
                                  {
                                    reservation.total_amount
                                  }
                                </span>
                              </div>
                            </div>

                            {reservation.notes && (
                              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                                {
                                  reservation.notes
                                }
                              </p>
                            )}
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
