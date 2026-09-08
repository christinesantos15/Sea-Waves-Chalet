"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCottageAvailability,
  type CottageAvailability,
} from "@/lib/clientResortApi";

import {
  convertOperatorInquiry,
  createOperatorInquiry,
  getInquiryCottageOptions,
  getOperatorInquiries,
  updateOperatorInquiryStatus,
  type CottageOption,
  type EditableInquiryStatus,
  type InquirySource,
  type InquiryStatus,
  type OperatorInquiry,
} from "@/lib/operatorInquiryApi";


type InquiryFilter =
  | "all"
  | InquiryStatus;


const FILTERS: {
  value: InquiryFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "new",
    label: "New",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "qualified",
    label: "Qualified",
  },
  {
    value: "converted",
    label: "Converted",
  },
  {
    value: "declined",
    label: "Declined",
  },
  {
    value: "closed",
    label: "Closed",
  },
];


const SOURCE_OPTIONS: {
  value: InquirySource;
  label: string;
}[] = [
  {
    value: "manual",
    label: "Manual",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "walk_in",
    label: "Walk-in",
  },
  {
    value: "facebook",
    label: "Facebook",
  },
  {
    value: "messenger",
    label: "Messenger",
  },
  {
    value: "website",
    label: "Website",
  },
];


function sourceLabel(
  source: InquirySource,
): string {
  switch (source) {
    case "walk_in":
      return "Walk-in";

    case "facebook":
      return "Facebook";

    case "messenger":
      return "Messenger";

    case "website":
      return "Website";

    case "phone":
      return "Phone";

    case "manual":
      return "Manual";
  }
}


function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}


function statusClass(
  status: InquiryStatus,
): string {
  switch (status) {
    case "new":
      return (
        "bg-sky-50 text-sky-700"
      );

    case "contacted":
      return (
        "bg-violet-50 text-violet-700"
      );

    case "qualified":
      return (
        "bg-emerald-50 text-emerald-700"
      );

    case "converted":
      return (
        "bg-amber-50 text-amber-700"
      );

    case "declined":
      return (
        "bg-red-50 text-red-700"
      );

    case "closed":
      return (
        "bg-slate-100 text-slate-600"
      );
  }
}


export default function OperatorInquiryInbox() {
  const [
    inquiries,
    setInquiries,
  ] = useState<OperatorInquiry[]>([]);

  const [
    cottages,
    setCottages,
  ] = useState<CottageOption[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  const [
    filter,
    setFilter,
  ] = useState<InquiryFilter>(
    "all",
  );

  const [
    busyInquiryId,
    setBusyInquiryId,
  ] = useState<number | null>(
    null,
  );


  // ----------------------------------
  // New inquiry form
  // ----------------------------------

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    facebookName,
    setFacebookName,
  ] = useState("");

  const [
    source,
    setSource,
  ] = useState<InquirySource>(
    "manual",
  );

  const [
    checkIn,
    setCheckIn,
  ] = useState("");

  const [
    checkOut,
    setCheckOut,
  ] = useState("");

  const [
    guestCount,
    setGuestCount,
  ] = useState("");

  const [
    inquiryMessage,
    setInquiryMessage,
  ] = useState("");


  // ----------------------------------
  // Conversion state
  // ----------------------------------

  const [
    conversionInquiryId,
    setConversionInquiryId,
  ] = useState<number | null>(
    null,
  );

  const [
    conversionCottageId,
    setConversionCottageId,
  ] = useState("");

  const [
    conversionRoomId,
    setConversionRoomId,
  ] = useState("");

  const [
    availability,
    setAvailability,
  ] = useState<CottageAvailability | null>(
    null,
  );

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState(false);


  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError(null);

          const [
            inquiryData,
            cottageData,
          ] = await Promise.all([
            getOperatorInquiries(),
            getInquiryCottageOptions(),
          ]);

          setInquiries(
            inquiryData,
          );

          setCottages(
            cottageData,
          );
        } catch (error) {
          if (
            error instanceof Error
          ) {
            setError(
              error.message,
            );
          } else {
            setError(
              "Could not load inquiries.",
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadData();
  }, [
    loadData,
  ]);


  const filteredInquiries =
    useMemo(
      () => {
        if (
          filter === "all"
        ) {
          return inquiries;
        }

        return inquiries.filter(
          (inquiry) =>
            inquiry.status ===
            filter,
        );
      },
      [
        filter,
        inquiries,
      ],
    );


  function countForFilter(
    value: InquiryFilter,
  ): number {
    if (
      value === "all"
    ) {
      return inquiries.length;
    }

    return inquiries.filter(
      (inquiry) =>
        inquiry.status === value,
    ).length;
  }


  async function handleCreateInquiry(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    if (
      !fullName.trim()
    ) {
      setError(
        "Guest name is required.",
      );

      return;
    }

    if (
      checkIn &&
      checkOut &&
      checkOut <= checkIn
    ) {
      setError(
        "Check-out must be after check-in.",
      );

      return;
    }

    try {
      const created =
        await createOperatorInquiry({
          full_name:
            fullName.trim(),

          phone:
            phone.trim() || null,

          email:
            email.trim() || null,

          facebook_name:
            facebookName.trim() ||
            null,

          messenger_psid:
            null,

          source,

          check_in:
            checkIn || null,

          check_out:
            checkOut || null,

          guest_count:
            guestCount
              ? Number(
                  guestCount,
                )
              : null,

          message:
            inquiryMessage.trim() ||
            null,
        });

      setInquiries(
        (current) => [
          created,
          ...current,
        ],
      );

      setFullName("");
      setPhone("");
      setEmail("");
      setFacebookName("");
      setSource("manual");
      setCheckIn("");
      setCheckOut("");
      setGuestCount("");
      setInquiryMessage("");

      setMessage(
        `Inquiry created for ${created.guest_name}.`,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not create inquiry.",
        );
      }
    }
  }


  async function handleStatusChange(
    inquiry: OperatorInquiry,
    nextStatus:
      EditableInquiryStatus,
  ) {
    try {
      setBusyInquiryId(
        inquiry.id,
      );

      setError(null);
      setMessage(null);

      const updated =
        await updateOperatorInquiryStatus(
          inquiry.id,
          nextStatus,
        );

      setInquiries(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );

      setMessage(
        `${updated.guest_name} moved to ${updated.status}.`,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not update inquiry.",
        );
      }
    } finally {
      setBusyInquiryId(
        null,
      );
    }
  }


  function openConversion(
    inquiry: OperatorInquiry,
  ) {
    setConversionInquiryId(
      inquiry.id,
    );

    setConversionCottageId(
      "",
    );

    setConversionRoomId(
      "",
    );

    setAvailability(
      null,
    );

    setError(
      null,
    );

    setMessage(
      null,
    );
  }


  function closeConversion() {
    setConversionInquiryId(
      null,
    );

    setConversionCottageId(
      "",
    );

    setConversionRoomId(
      "",
    );

    setAvailability(
      null,
    );
  }


  async function handleCottageChange(
    inquiry: OperatorInquiry,
    cottageValue: string,
  ) {
    setConversionCottageId(
      cottageValue,
    );

    setConversionRoomId(
      "",
    );

    setAvailability(
      null,
    );

    if (
      !cottageValue
    ) {
      return;
    }

    if (
      !inquiry.check_in ||
      !inquiry.check_out
    ) {
      setError(
        "This inquiry needs check-in and check-out dates before conversion.",
      );

      return;
    }

    try {
      setLoadingAvailability(
        true,
      );

      setError(null);

      const result =
        await getCottageAvailability(
          Number(
            cottageValue,
          ),
          inquiry.check_in,
          inquiry.check_out,
        );

      setAvailability(
        result,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not check room availability.",
        );
      }
    } finally {
      setLoadingAvailability(
        false,
      );
    }
  }


  async function handleConvert(
    inquiry: OperatorInquiry,
  ) {
    if (
      !conversionCottageId ||
      !conversionRoomId
    ) {
      setError(
        "Choose a cottage and available room.",
      );

      return;
    }

    try {
      setBusyInquiryId(
        inquiry.id,
      );

      setError(null);
      setMessage(null);

      const result =
        await convertOperatorInquiry(
          inquiry.id,
          Number(
            conversionCottageId,
          ),
          Number(
            conversionRoomId,
          ),
        );

      setMessage(
        `Reservation ${result.reservation_reference} created for ${inquiry.guest_name}.`,
      );

      closeConversion();

      await loadData();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          "Could not convert inquiry.",
        );
      }
    } finally {
      setBusyInquiryId(
        null,
      );
    }
  }


  function statusActions(
    inquiry: OperatorInquiry,
  ) {
    const busy =
      busyInquiryId ===
      inquiry.id;

    if (
      inquiry.status === "new"
    ) {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "contacted",
              )
            }
            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Mark contacted
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "declined",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Decline
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "closed",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </>
      );
    }

    if (
      inquiry.status ===
      "contacted"
    ) {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "qualified",
              )
            }
            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Qualify
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "declined",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Decline
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "closed",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </>
      );
    }

    if (
      inquiry.status ===
      "qualified"
    ) {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              openConversion(
                inquiry,
              )
            }
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Convert to reservation
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "declined",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Decline
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void handleStatusChange(
                inquiry,
                "closed",
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </>
      );
    }

    return null;
  }


  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Manual intake
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            New inquiry
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Record phone, walk-in,
            Facebook, Messenger or
            other resort inquiries.
          </p>
        </div>


        <form
          onSubmit={
            handleCreateInquiry
          }
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Guest name *
            </span>

            <input
              value={fullName}
              onChange={(
                event,
              ) =>
                setFullName(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Guest name"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Source
            </span>

            <select
              value={source}
              onChange={(
                event,
              ) =>
                setSource(
                  event.target
                    .value as InquirySource,
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
            >
              {SOURCE_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Phone
            </span>

            <input
              value={phone}
              onChange={(
                event,
              ) =>
                setPhone(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Phone number"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Email
            </span>

            <input
              type="email"
              value={email}
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Email address"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Facebook name
            </span>

            <input
              value={
                facebookName
              }
              onChange={(
                event,
              ) =>
                setFacebookName(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Facebook profile name"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Guests
            </span>

            <input
              type="number"
              min="1"
              value={guestCount}
              onChange={(
                event,
              ) =>
                setGuestCount(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Guest count"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Check-in
            </span>

            <input
              type="date"
              value={checkIn}
              onChange={(
                event,
              ) =>
                setCheckIn(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
            />
          </label>


          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Check-out
            </span>

            <input
              type="date"
              value={checkOut}
              onChange={(
                event,
              ) =>
                setCheckOut(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
            />
          </label>


          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Message / request
            </span>

            <textarea
              rows={4}
              value={
                inquiryMessage
              }
              onChange={(
                event,
              ) =>
                setInquiryMessage(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="What is the guest asking about?"
            />
          </label>


          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add inquiry
            </button>
          </div>
        </form>
      </section>


      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}


      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Inbox
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Resort inquiries
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track inquiries from first
              contact through booking.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>


        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(
            (item) => {
              const active =
                filter ===
                item.value;

              return (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      item.value,
                    )
                  }
                  className={
                    active
                      ? "rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                      : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  }
                >
                  {item.label}{" "}
                  <span className="ml-1 opacity-70">
                    {countForFilter(
                      item.value,
                    )}
                  </span>
                </button>
              );
            },
          )}
        </div>


        {loading ? (
          <p className="mt-8 text-sm text-slate-500">
            Loading inquiries...
          </p>
        ) : filteredInquiries.length ===
          0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No inquiries here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredInquiries.map(
              (inquiry) => {
                const conversionOpen =
                  conversionInquiryId ===
                  inquiry.id;

                const availableRooms =
                  availability?.rooms.filter(
                    (room) =>
                      room.available,
                  ) ?? [];

                return (
                  <article
                    key={
                      inquiry.id
                    }
                    className="rounded-2xl border border-slate-200 p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">
                            {
                              inquiry.guest_name
                            }
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(
                              inquiry.status,
                            )}`}
                          >
                            {
                              inquiry.status
                            }
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {sourceLabel(
                              inquiry.source,
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          Inquiry #
                          {inquiry.id}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {statusActions(
                          inquiry,
                        )}
                      </div>
                    </div>


                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Contact
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {inquiry.guest_phone ??
                            "No phone"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {inquiry.guest_email ??
                            "No email"}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Facebook
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {inquiry.facebook_name ??
                            "Not provided"}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Stay
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {formatDate(
                            inquiry.check_in,
                          )}
                        </p>

                        <p className="text-sm text-slate-500">
                          to{" "}
                          {formatDate(
                            inquiry.check_out,
                          )}
                        </p>
                      </div>


                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Guests
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {inquiry.guest_count ??
                            "Not provided"}
                        </p>
                      </div>
                    </div>


                    {inquiry.message && (
                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Message
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            inquiry.message
                          }
                        </p>
                      </div>
                    )}


                    {conversionOpen && (
                      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                              Convert
                            </p>

                            <h4 className="mt-1 font-semibold text-slate-950">
                              Create pending reservation
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={
                              closeConversion
                            }
                            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>


                        {(
                          !inquiry.check_in ||
                          !inquiry.check_out ||
                          !inquiry.guest_count
                        ) ? (
                          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                            Check-in,
                            check-out and
                            guest count are
                            required before
                            this inquiry can
                            be converted.
                          </p>
                        ) : (
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="space-y-1.5">
                              <span className="text-sm font-semibold text-slate-700">
                                Cottage
                              </span>

                              <select
                                value={
                                  conversionCottageId
                                }
                                onChange={(
                                  event,
                                ) =>
                                  void handleCottageChange(
                                    inquiry,
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500"
                              >
                                <option value="">
                                  Choose cottage
                                </option>

                                {cottages.map(
                                  (cottage) => (
                                    <option
                                      key={
                                        cottage.id
                                      }
                                      value={
                                        cottage.id
                                      }
                                    >
                                      {
                                        cottage.name
                                      }
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>


                            <label className="space-y-1.5">
                              <span className="text-sm font-semibold text-slate-700">
                                Available room
                              </span>

                              <select
                                value={
                                  conversionRoomId
                                }
                                disabled={
                                  loadingAvailability ||
                                  !availability
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setConversionRoomId(
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
                              >
                                <option value="">
                                  {loadingAvailability
                                    ? "Checking..."
                                    : "Choose room"}
                                </option>

                                {availableRooms.map(
                                  (room) => (
                                    <option
                                      key={
                                        room.id
                                      }
                                      value={
                                        room.id
                                      }
                                    >
                                      {
                                        room.name
                                      }
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>


                            {availability &&
                              availableRooms.length ===
                                0 && (
                                <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                  No available
                                  rooms in this
                                  cottage for the
                                  selected dates.
                                </div>
                              )}


                            <div className="md:col-span-2">
                              <button
                                type="button"
                                disabled={
                                  !conversionRoomId ||
                                  busyInquiryId ===
                                    inquiry.id
                                }
                                onClick={() =>
                                  void handleConvert(
                                    inquiry,
                                  )
                                }
                                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Create reservation
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}