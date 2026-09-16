"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type CottageAvailability,
  getCottageAvailability,
} from "@/lib/clientResortApi";

import {
  type CottageOption,
  type EditableInquiryStatus,
  type InquirySource,
  type InquiryStatus,
  type OperatorInquiry,
  convertOperatorInquiry,
  createOperatorInquiry,
  getInquiryCottageOptions,
  getOperatorInquiries,
  updateOperatorInquiry,
  updateOperatorInquiryStatus,
} from "@/lib/operatorInquiryApi";


type FilterValue =
  | "all"
  | InquiryStatus;


type SourceFilter =
  | "all"
  | InquirySource;


const FILTERS: Array<{
  value: FilterValue;
  label: string;
}> = [
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


const SOURCES: Array<{
  value: InquirySource;
  label: string;
}> = [
  {
    value: "messenger",
    label: "Messenger",
  },
  {
    value: "facebook",
    label: "Facebook",
  },
  {
    value: "website",
    label: "Website",
  },
  {
    value: "walk_in",
    label: "Walk-in",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "manual",
    label: "Manual",
  },
];


function sourceLabel(
  source: InquirySource,
): string {
  switch (source) {
    case "messenger":
      return "Messenger";

    case "facebook":
      return "Facebook";

    case "website":
      return "Website";

    case "walk_in":
      return "Walk-in";

    case "phone":
      return "Phone";

    case "manual":
      return "Manual";

    default:
      return source;
  }
}


function statusClass(
  status: InquiryStatus,
): string {
  switch (status) {
    case "new":
      return (
        "bg-sky-100 text-sky-700"
      );

    case "contacted":
      return (
        "bg-violet-100 text-violet-700"
      );

    case "qualified":
      return (
        "bg-amber-100 text-amber-700"
      );

    case "converted":
      return (
        "bg-emerald-100 text-emerald-700"
      );

    case "declined":
      return (
        "bg-red-100 text-red-700"
      );

    case "closed":
      return (
        "bg-slate-200 text-slate-700"
      );

    default:
      return (
        "bg-slate-100 text-slate-700"
      );
  }
}


function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(
    `${value}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}


function errorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Something went wrong.";
}


export default function OperatorInquiryInbox() {
  const [
    inquiries,
    setInquiries,
  ] = useState<
    OperatorInquiry[]
  >([]);

  const [
    cottages,
    setCottages,
  ] = useState<
    CottageOption[]
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
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);


  // ------------------------------------------------
  // Inbox filters
  // ------------------------------------------------

  const [
    filter,
    setFilter,
  ] = useState<FilterValue>(
    "all",
  );

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState<SourceFilter>(
    "all",
  );

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  // ------------------------------------------------
  // New inquiry form
  // ------------------------------------------------

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
    "messenger",
  );

  const [
    guestCount,
    setGuestCount,
  ] = useState("");

  const [
    checkIn,
    setCheckIn,
  ] = useState("");

  const [
    checkOut,
    setCheckOut,
  ] = useState("");

  const [
    inquiryMessage,
    setInquiryMessage,
  ] = useState("");

  const [
    creatingInquiry,
    setCreatingInquiry,
  ] = useState(false);


  // ------------------------------------------------
  // Inquiry actions
  // ------------------------------------------------

  const [
    busyInquiryId,
    setBusyInquiryId,
  ] = useState<
    number | null
  >(null);


  // ------------------------------------------------
  // Inquiry editing
  // ------------------------------------------------

  const [
    editingInquiryId,
    setEditingInquiryId,
  ] = useState<
    number | null
  >(null);

  const [
    editFullName,
    setEditFullName,
  ] = useState("");

  const [
    editPhone,
    setEditPhone,
  ] = useState("");

  const [
    editEmail,
    setEditEmail,
  ] = useState("");

  const [
    editFacebookName,
    setEditFacebookName,
  ] = useState("");

  const [
    editMessengerPsid,
    setEditMessengerPsid,
  ] = useState("");

  const [
    editCheckIn,
    setEditCheckIn,
  ] = useState("");

  const [
    editCheckOut,
    setEditCheckOut,
  ] = useState("");

  const [
    editGuestCount,
    setEditGuestCount,
  ] = useState("");

  const [
    editMessage,
    setEditMessage,
  ] = useState("");


  // ------------------------------------------------
  // Inquiry → reservation conversion
  // ------------------------------------------------

  const [
    conversionInquiryId,
    setConversionInquiryId,
  ] = useState<
    number | null
  >(null);

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
  ] = useState<
    CottageAvailability | null
  >(null);

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState(false);


  // ------------------------------------------------
  // Loading
  // ------------------------------------------------

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError(null);

          const filters = {
            q:
              searchQuery ||
              undefined,

            source:
              sourceFilter ===
              "all"
                ? undefined
                : sourceFilter,
          };

          const [
            inquiryData,
            cottageData,
          ] = await Promise.all([
            getOperatorInquiries(
              filters,
            ),
            getInquiryCottageOptions(),
          ]);

          setInquiries(
            inquiryData,
          );

          setCottages(
            cottageData,
          );
        } catch (loadError) {
          setError(
            errorMessage(
              loadError,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        searchQuery,
        sourceFilter,
      ],
    );


  useEffect(
    () => {
      void loadData();
    },
    [loadData],
  );


  // ------------------------------------------------
  // Filtered inbox
  // ------------------------------------------------

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
    value: FilterValue,
  ): number {
    if (
      value === "all"
    ) {
      return inquiries.length;
    }

    return inquiries.filter(
      (inquiry) =>
        inquiry.status ===
        value,
    ).length;
  }


  const filtersActive =
    searchQuery.length > 0 ||
    sourceFilter !== "all" ||
    filter !== "all";


  // ------------------------------------------------
  // Search
  // ------------------------------------------------

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearchQuery(
      searchInput.trim(),
    );

    setEditingInquiryId(
      null,
    );

    closeConversion();
  }


  function clearFilters() {
    setSearchInput("");
    setSearchQuery("");
    setSourceFilter(
      "all",
    );
    setFilter(
      "all",
    );

    setEditingInquiryId(
      null,
    );

    closeConversion();
  }


  // ------------------------------------------------
  // Create inquiry
  // ------------------------------------------------

  async function handleCreateInquiry(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    const cleanedName =
      fullName.trim();

    if (!cleanedName) {
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

    const parsedGuestCount =
      guestCount
        ? Number(
            guestCount,
          )
        : null;

    if (
      parsedGuestCount !== null &&
      (
        !Number.isInteger(
          parsedGuestCount,
        ) ||
        parsedGuestCount < 1
      )
    ) {
      setError(
        "Guest count must be at least 1.",
      );

      return;
    }

    try {
      setCreatingInquiry(
        true,
      );

      await createOperatorInquiry(
        {
          full_name:
            cleanedName,

          phone:
            phone.trim() ||
            null,

          email:
            email.trim() ||
            null,

          facebook_name:
            facebookName.trim() ||
            null,

          messenger_psid:
            null,

          source,

          check_in:
            checkIn ||
            null,

          check_out:
            checkOut ||
            null,

          guest_count:
            parsedGuestCount,

          message:
            inquiryMessage.trim() ||
            null,
        },
      );

      setFullName("");
      setPhone("");
      setEmail("");
      setFacebookName("");
      setSource(
        "messenger",
      );
      setGuestCount("");
      setCheckIn("");
      setCheckOut("");
      setInquiryMessage("");

      setMessage(
        "Inquiry added.",
      );

      await loadData();
    } catch (createError) {
      setError(
        errorMessage(
          createError,
        ),
      );
    } finally {
      setCreatingInquiry(
        false,
      );
    }
  }


  // ------------------------------------------------
  // Status actions
  // ------------------------------------------------

  async function handleStatusChange(
    inquiry: OperatorInquiry,
    nextStatus: EditableInquiryStatus,
  ) {
    try {
      setBusyInquiryId(
        inquiry.id,
      );

      setError(null);
      setMessage(null);

      await updateOperatorInquiryStatus(
        inquiry.id,
        nextStatus,
      );

      setMessage(
        `Inquiry #${inquiry.id} moved to ${nextStatus}.`,
      );

      await loadData();
    } catch (statusError) {
      setError(
        errorMessage(
          statusError,
        ),
      );
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
      inquiry.status ===
      "new"
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
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark qualified
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
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </>
      );
    }

    return null;
  }


  // ------------------------------------------------
  // Edit inquiry
  // ------------------------------------------------

  function openEditInquiry(
    inquiry: OperatorInquiry,
  ) {
    closeConversion();

    setEditingInquiryId(
      inquiry.id,
    );

    setEditFullName(
      inquiry.guest_name,
    );

    setEditPhone(
      inquiry.guest_phone ??
        "",
    );

    setEditEmail(
      inquiry.guest_email ??
        "",
    );

    setEditFacebookName(
      inquiry.facebook_name ??
        "",
    );

    setEditMessengerPsid(
      inquiry.messenger_psid ??
        "",
    );

    setEditCheckIn(
      inquiry.check_in ??
        "",
    );

    setEditCheckOut(
      inquiry.check_out ??
        "",
    );

    setEditGuestCount(
      inquiry.guest_count !==
        null
        ? String(
            inquiry.guest_count,
          )
        : "",
    );

    setEditMessage(
      inquiry.message ??
        "",
    );

    setError(null);
    setMessage(null);
  }


  function closeEditInquiry() {
    setEditingInquiryId(
      null,
    );

    setEditFullName("");
    setEditPhone("");
    setEditEmail("");
    setEditFacebookName("");
    setEditMessengerPsid("");
    setEditCheckIn("");
    setEditCheckOut("");
    setEditGuestCount("");
    setEditMessage("");
  }


  async function handleSaveInquiry(
    inquiry: OperatorInquiry,
  ) {
    const cleanedName =
      editFullName.trim();

    if (!cleanedName) {
      setError(
        "Guest name cannot be empty.",
      );

      return;
    }

    if (
      editCheckIn &&
      editCheckOut &&
      editCheckOut <=
        editCheckIn
    ) {
      setError(
        "Check-out must be after check-in.",
      );

      return;
    }

    const parsedGuestCount =
      editGuestCount
        ? Number(
            editGuestCount,
          )
        : null;

    if (
      parsedGuestCount !== null &&
      (
        !Number.isInteger(
          parsedGuestCount,
        ) ||
        parsedGuestCount < 1
      )
    ) {
      setError(
        "Guest count must be at least 1.",
      );

      return;
    }

    try {
      setBusyInquiryId(
        inquiry.id,
      );

      setError(null);
      setMessage(null);

      await updateOperatorInquiry(
        inquiry.id,
        {
          full_name:
            cleanedName,

          phone:
            editPhone.trim() ||
            null,

          email:
            editEmail.trim() ||
            null,

          facebook_name:
            editFacebookName.trim() ||
            null,

          messenger_psid:
            editMessengerPsid.trim() ||
            null,

          check_in:
            editCheckIn ||
            null,

          check_out:
            editCheckOut ||
            null,

          guest_count:
            parsedGuestCount,

          message:
            editMessage.trim() ||
            null,
        },
      );

      closeEditInquiry();

      setMessage(
        `Inquiry #${inquiry.id} updated.`,
      );

      await loadData();
    } catch (saveError) {
      setError(
        errorMessage(
          saveError,
        ),
      );
    } finally {
      setBusyInquiryId(
        null,
      );
    }
  }


  // ------------------------------------------------
  // Conversion
  // ------------------------------------------------

  function openConversion(
    inquiry: OperatorInquiry,
  ) {
    closeEditInquiry();

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

    setError(null);
    setMessage(null);
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

    setLoadingAvailability(
      false,
    );
  }


  async function handleCottageChange(
    inquiry: OperatorInquiry,
    value: string,
  ) {
    setConversionCottageId(
      value,
    );

    setConversionRoomId(
      "",
    );

    setAvailability(
      null,
    );

    if (!value) {
      return;
    }

    if (
      !inquiry.check_in ||
      !inquiry.check_out
    ) {
      setError(
        "Check-in and check-out dates are required before checking availability.",
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
          Number(value),
          inquiry.check_in,
          inquiry.check_out,
        );

      setAvailability(
        result,
      );
    } catch (
      availabilityError
    ) {
      setError(
        errorMessage(
          availabilityError,
        ),
      );
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
        "Choose an available cottage and room.",
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

      closeConversion();

      setMessage(
        `Reservation ${result.reservation_reference} created from inquiry #${inquiry.id}.`,
      );

      await loadData();
    } catch (
      convertError
    ) {
      setError(
        errorMessage(
          convertError,
        ),
      );
    } finally {
      setBusyInquiryId(
        null,
      );
    }
  }


  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            New inquiry
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Record a guest inquiry
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add Messenger, Facebook,
            website, phone, walk-in or
            manually received inquiries
            to the resort inbox.
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
              value={
                fullName
              }
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
              value={
                source
              }
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
              {SOURCES.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
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
              value={
                phone
              }
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
              value={
                email
              }
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
              value={
                guestCount
              }
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
              value={
                checkIn
              }
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
              value={
                checkOut
              }
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
              disabled={
                creatingInquiry
              }
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingInquiry
                ? "Adding..."
                : "Add inquiry"}
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
              Search and track guest
              inquiries from first contact
              through booking.
            </p>
          </div>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={() =>
              void loadData()
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>


        {/* Search + source filter */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <form
            onSubmit={
              handleSearch
            }
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]"
          >
            <label>
              <span className="sr-only">
                Search inquiries
              </span>

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
                placeholder="Search guest, phone, email, Facebook or message..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>


            <label>
              <span className="sr-only">
                Filter by source
              </span>

              <select
                value={
                  sourceFilter
                }
                onChange={(
                  event,
                ) => {
                  setSourceFilter(
                    event.target
                      .value as SourceFilter,
                  );

                  setEditingInquiryId(
                    null,
                  );

                  closeConversion();
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="all">
                  All sources
                </option>

                {SOURCES.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </label>


            <button
              type="submit"
              className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Search
            </button>


            <button
              type="button"
              disabled={
                !filtersActive &&
                !searchInput
              }
              onClick={
                clearFilters
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </form>


          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p>
              Search checks guest name,
              phone, email, Facebook name
              and inquiry message.
            </p>

            {(searchQuery ||
              sourceFilter !==
                "all") && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600 shadow-sm">
                    Search:{" "}
                    {searchQuery}
                  </span>
                )}

                {sourceFilter !==
                  "all" && (
                  <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600 shadow-sm">
                    Source:{" "}
                    {sourceLabel(
                      sourceFilter,
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Status filters */}
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
                  onClick={() => {
                    setFilter(
                      item.value,
                    );

                    setEditingInquiryId(
                      null,
                    );

                    closeConversion();
                  }}
                  className={
                    active
                      ? "rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                      : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
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


        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {
                filteredInquiries.length
              }
            </span>{" "}
            {filteredInquiries.length ===
            1
              ? "inquiry"
              : "inquiries"}
          </p>

          {filtersActive && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
            >
              Reset all filters
            </button>
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
              No inquiries found.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {filtersActive
                ? "Try changing or clearing the current filters."
                : "New inquiries will appear here."}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredInquiries.map(
              (inquiry) => {
                const conversionOpen =
                  conversionInquiryId ===
                  inquiry.id;

                const editOpen =
                  editingInquiryId ===
                  inquiry.id;

                const availableRooms =
                  availability?.rooms.filter(
                    (room) =>
                      room.available,
                  ) ?? [];

                const busy =
                  busyInquiryId ===
                  inquiry.id;

                return (
                  <article
                    key={
                      inquiry.id
                    }
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 sm:p-6"
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
                        {inquiry.status !==
                          "converted" && (
                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              openEditInquiry(
                                inquiry,
                              )
                            }
                            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                          >
                            Edit inquiry
                          </button>
                        )}

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

                        {inquiry.messenger_psid && (
                          <p className="mt-1 break-all text-xs text-slate-400">
                            Messenger ID:{" "}
                            {
                              inquiry.messenger_psid
                            }
                          </p>
                        )}
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


                    {inquiry.status ===
                      "converted" && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        This inquiry has been
                        converted to a
                        reservation and is now
                        read-only.
                      </div>
                    )}


                    {/* Edit panel */}
                    {editOpen && (
                      <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                              Edit inquiry
                            </p>

                            <h4 className="mt-1 font-semibold text-slate-950">
                              Update guest and
                              stay details
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              Use this when the
                              guest gives you
                              more information
                              during the
                              conversation.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              closeEditInquiry
                            }
                            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>


                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Guest name *
                            </span>

                            <input
                              value={
                                editFullName
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditFullName(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Phone
                            </span>

                            <input
                              value={
                                editPhone
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditPhone(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Email
                            </span>

                            <input
                              type="email"
                              value={
                                editEmail
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditEmail(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Facebook name
                            </span>

                            <input
                              value={
                                editFacebookName
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditFacebookName(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5 md:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">
                              Messenger PSID
                            </span>

                            <input
                              value={
                                editMessengerPsid
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditMessengerPsid(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                              placeholder="Usually filled automatically after Messenger integration"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Check-in
                            </span>

                            <input
                              type="date"
                              value={
                                editCheckIn
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditCheckIn(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Check-out
                            </span>

                            <input
                              type="date"
                              value={
                                editCheckOut
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditCheckOut(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">
                              Guests
                            </span>

                            <input
                              type="number"
                              min="1"
                              value={
                                editGuestCount
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditGuestCount(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <label className="space-y-1.5 md:col-span-2">
                            <span className="text-sm font-semibold text-slate-700">
                              Message / notes
                            </span>

                            <textarea
                              rows={4}
                              value={
                                editMessage
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditMessage(
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-sky-500"
                            />
                          </label>


                          <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                void handleSaveInquiry(
                                  inquiry,
                                )
                              }
                              className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy
                                ? "Saving..."
                                : "Save changes"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={
                                closeEditInquiry
                              }
                              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Reservation conversion panel */}
                    {conversionOpen && (
                      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                              Convert
                            </p>

                            <h4 className="mt-1 font-semibold text-slate-950">
                              Create pending
                              reservation
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
                                  (
                                    cottage,
                                  ) => (
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
                                  (
                                    room,
                                  ) => (
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
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 md:col-span-2">
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
                                {busy
                                  ? "Creating..."
                                  : "Create reservation"}
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