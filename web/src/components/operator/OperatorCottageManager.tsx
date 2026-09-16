"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type CottageMedia,
  type OperatorCottage,
  createCottageMedia,
  deactivateCottageMedia,
  getOperatorCottage,
  getOperatorCottages,
  updateCottageMedia,
  updateOperatorCottage,
  updateOperatorRoomType,
} from "@/lib/operatorCottageApi";

import {
  getRoomTypes,
  type RoomTypePricing,
} from "@/lib/operatorPricingApi";


type CottageForm = {
  name: string;
  description: string;
  capacity: string;
  base_rate: string;
  status: string;
  is_active: boolean;
};

type MediaForm = {
  media_type: "image" | "video";
  url: string;
  alt_text: string;
  caption: string;
  sort_order: string;
  is_cover: boolean;
};


function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}


function cottageToForm(
  cottage: OperatorCottage,
): CottageForm {
  return {
    name: cottage.name,
    description:
      cottage.description ?? "",
    capacity:
      cottage.capacity?.toString() ??
      "",
    base_rate:
      cottage.base_rate?.toString() ??
      "",
    status: cottage.status,
    is_active: cottage.is_active,
  };
}


function emptyMediaForm(): MediaForm {
  return {
    media_type: "image",
    url: "",
    alt_text: "",
    caption: "",
    sort_order: "0",
    is_cover: false,
  };
}


function labelStatus(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function mediaPreview(
  media: CottageMedia,
) {
  if (
    media.media_type === "image"
  ) {
    return (
      <div className="overflow-hidden rounded-2xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={
            media.alt_text ??
            media.caption ??
            "Cottage media"
          }
          className="h-44 w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-100 px-5 text-center text-sm text-slate-500">
      Video
      <br />
      {media.url}
    </div>
  );
}


export default function OperatorCottageManager() {
  const [
    cottages,
    setCottages,
  ] = useState<
    OperatorCottage[]
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
    selectedId,
    setSelectedId,
  ] = useState<number | null>(
    null,
  );

  const [
    selected,
    setSelected,
  ] = useState<
    OperatorCottage | null
  >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<CottageForm>({
    name: "",
    description: "",
    capacity: "",
    base_rate: "",
    status: "available",
    is_active: true,
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveError,
    setSaveError,
  ] = useState<string | null>(
    null,
  );

  const [
    saveSuccess,
    setSaveSuccess,
  ] = useState<string | null>(
    null,
  );

  const [
    mediaForm,
    setMediaForm,
  ] = useState<MediaForm>(
    emptyMediaForm(),
  );

  const [
    mediaSaving,
    setMediaSaving,
  ] = useState(false);

  const [
    mediaError,
    setMediaError,
  ] = useState<string | null>(
    null,
  );


  const [
    roomTypes,
    setRoomTypes,
  ] = useState<RoomTypePricing[]>([]);

  const [
    roomTypesLoading,
    setRoomTypesLoading,
  ] = useState(true);

  const [
    roomTypeSavingId,
    setRoomTypeSavingId,
  ] = useState<number | null>(null);

  const [
    roomTypeError,
    setRoomTypeError,
  ] = useState<string | null>(
    null,
  );


  const loadCottages =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const data =
            await getOperatorCottages();

          setCottages(data);

          setSelectedId(
            (current) =>
              current ??
              data[0]?.id ??
              null,
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
    void loadCottages();
  }, [
    loadCottages,
  ]);


  const loadRoomTypes =
    useCallback(
      async () => {
        setRoomTypesLoading(true);
        setRoomTypeError(null);

        try {
          const data =
            await getRoomTypes();

          setRoomTypes(
            data.filter(
              (roomType) =>
                roomType.is_active,
            ),
          );
        } catch (err) {
          setRoomTypeError(
            errorMessage(err),
          );
        } finally {
          setRoomTypesLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadRoomTypes();
  }, [
    loadRoomTypes,
  ]);


  const loadSelected =
    useCallback(
      async (
        cottageId: number,
      ) => {
        setDetailLoading(true);
        setSaveError(null);
        setSaveSuccess(null);
        setMediaError(null);

        try {
          const data =
            await getOperatorCottage(
              cottageId,
            );

          setSelected(data);
          setForm(
            cottageToForm(data),
          );
        } catch (err) {
          setSelected(null);
          setSaveError(
            errorMessage(err),
          );
        } finally {
          setDetailLoading(false);
        }
      },
      [],
    );


  useEffect(() => {
    if (
      selectedId === null
    ) {
      setSelected(null);
      return;
    }

    void loadSelected(
      selectedId,
    );
  }, [
    selectedId,
    loadSelected,
  ]);


  async function refreshSelected() {
    if (
      selectedId === null
    ) {
      return;
    }

    const detail =
      await getOperatorCottage(
        selectedId,
      );

    setSelected(detail);
    setForm(
      cottageToForm(detail),
    );

    setCottages(
      (current) =>
        current.map(
          (item) =>
            item.id === detail.id
              ? detail
              : item,
        ),
    );
  }


  async function submitCottage(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated =
        await updateOperatorCottage(
          selected.id,
          {
            name:
              form.name.trim(),
            description:
              form.description.trim() ||
              null,
            capacity:
              form.capacity.trim()
                ? Number(
                    form.capacity,
                  )
                : null,
            base_rate:
              form.base_rate.trim()
                ? Number(
                    form.base_rate,
                  )
                : null,
            status:
              form.status.trim(),
            is_active:
              form.is_active,
          },
        );

      setSelected(updated);
      setForm(
        cottageToForm(updated),
      );

      setCottages(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );

      setSaveSuccess(
        "Cottage details saved.",
      );
    } catch (err) {
      setSaveError(
        errorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  }


  async function submitMedia(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    setMediaSaving(true);
    setMediaError(null);

    try {
      await createCottageMedia(
        selected.id,
        {
          media_type:
            mediaForm.media_type,
          url:
            mediaForm.url.trim(),
          alt_text:
            mediaForm.alt_text.trim() ||
            null,
          caption:
            mediaForm.caption.trim() ||
            null,
          sort_order:
            Number(
              mediaForm.sort_order ||
              "0",
            ),
          is_cover:
            mediaForm.is_cover,
          is_active: true,
        },
      );

      setMediaForm(
        emptyMediaForm(),
      );

      await refreshSelected();
    } catch (err) {
      setMediaError(
        errorMessage(err),
      );
    } finally {
      setMediaSaving(false);
    }
  }


  async function setCover(
    media: CottageMedia,
  ) {
    if (!selected) {
      return;
    }

    setMediaError(null);

    try {
      await updateCottageMedia(
        selected.id,
        media.id,
        {
          is_active: true,
          is_cover: true,
        },
      );

      await refreshSelected();
    } catch (err) {
      setMediaError(
        errorMessage(err),
      );
    }
  }


  async function toggleMediaActive(
    media: CottageMedia,
  ) {
    if (!selected) {
      return;
    }

    setMediaError(null);

    try {
      if (media.is_active) {
        await deactivateCottageMedia(
          selected.id,
          media.id,
        );
      } else {
        await updateCottageMedia(
          selected.id,
          media.id,
          {
            is_active: true,
          },
        );
      }

      await refreshSelected();
    } catch (err) {
      setMediaError(
        errorMessage(err),
      );
    }
  }


  async function handleRoomTypeAssignment(
    roomId: number,
    value: string,
  ) {
    if (selected === null) {
      return;
    }

    const roomTypeId =
      value === ""
        ? null
        : Number(value);

    if (
      roomTypeId !== null &&
      !Number.isInteger(roomTypeId)
    ) {
      setRoomTypeError(
        "Choose a valid room type.",
      );

      return;
    }

    setRoomTypeSavingId(roomId);
    setRoomTypeError(null);
    setSaveSuccess(null);

    try {
      const updated =
        await updateOperatorRoomType(
          selected.id,
          roomId,
          roomTypeId,
        );

      setSelected(
        (current) => {
          if (current === null) {
            return current;
          }

          return {
            ...current,
            rooms:
              current.rooms.map(
                (room) =>
                  room.id === updated.id
                    ? updated
                    : room,
              ),
          };
        },
      );

      setCottages(
        (current) =>
          current.map(
            (cottage) =>
              cottage.id === selected.id
                ? {
                    ...cottage,
                    rooms:
                      cottage.rooms.map(
                        (room) =>
                          room.id ===
                          updated.id
                            ? updated
                            : room,
                      ),
                  }
                : cottage,
          ),
      );

      setSaveSuccess(
        updated.room_type_id === null
          ? `${updated.code} is now unassigned.`
          : `${updated.code} room type updated.`,
      );
    } catch (err) {
      setRoomTypeError(
        errorMessage(err),
      );
    } finally {
      setRoomTypeSavingId(null);
    }
  }


  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:self-start">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Inventory
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Cottages
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a cottage to
            manage its public
            content.
          </p>
        </div>

        {loading ? (
          <p className="px-2 py-6 text-sm text-slate-500">
            Loading cottages...
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <div className="space-y-2">
            {cottages.map(
              (cottage) => {
                const active =
                  cottage.id ===
                  selectedId;

                return (
                  <button
                    key={
                      cottage.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        cottage.id,
                      )
                    }
                    className={[
                      "w-full rounded-2xl border p-3 text-left transition",
                      active
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-sky-700">
                          {
                            cottage.code
                          }
                        </p>

                        <p className="mt-0.5 font-semibold text-slate-900">
                          {
                            cottage.name
                          }
                        </p>
                      </div>

                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          cottage.is_active
                            ? "bg-emerald-500"
                            : "bg-slate-300",
                        ].join(
                          " ",
                        )}
                      />
                    </div>
                  </button>
                );
              },
            )}
          </div>
        )}
      </aside>

      <section className="min-w-0">
        {detailLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">
              Loading cottage...
            </p>
          </div>
        ) : !selected ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Choose a cottage to
              begin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={
                submitCottage
              }
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {
                      selected.code
                    }
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Cottage details
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    These details are
                    used by the
                    customer booking
                    experience.
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {labelStatus(
                    selected.status,
                  )}
                </span>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Cottage name
                  </span>

                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Description
                  </span>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    rows={5}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-slate-700">
                    Capacity
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.capacity
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          capacity:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="TBD"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-slate-700">
                    Base rate
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.base_rate
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          base_rate:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="TBD"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-slate-700">
                    Status
                  </span>

                  <input
                    value={
                      form.status
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          is_active:
                            event
                              .target
                              .checked,
                        }),
                      )
                    }
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      Active
                    </span>

                    <span className="text-xs text-slate-500">
                      Visible in
                      public inventory
                    </span>
                  </span>
                </label>
              </div>

              {saveError && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {saveSuccess}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save cottage"}
                </button>
              </div>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Media
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Cover & gallery
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Add image or video
                  paths now. Direct file
                  uploads will come in a
                  later feature.
                </p>
              </div>

              {mediaError && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {mediaError}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selected.media.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                    No media has been
                    added yet.
                  </div>
                ) : (
                  selected.media.map(
                    (media) => (
                      <article
                        key={
                          media.id
                        }
                        className={[
                          "rounded-2xl border p-3",
                          media.is_active
                            ? "border-slate-200 bg-white"
                            : "border-slate-200 bg-slate-50 opacity-70",
                        ].join(
                          " ",
                        )}
                      >
                        {mediaPreview(
                          media,
                        )}

                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {media.is_cover && (
                              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                Cover
                              </span>
                            )}

                            {!media.is_active && (
                              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="mt-3 break-all text-xs text-slate-500">
                            {
                              media.url
                            }
                          </p>

                          {media.caption && (
                            <p className="mt-2 text-sm text-slate-700">
                              {
                                media.caption
                              }
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-400">
                            Order{" "}
                            {
                              media.sort_order
                            }
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {media.is_active &&
                              !media.is_cover && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void setCover(
                                      media,
                                    )
                                  }
                                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                >
                                  Set cover
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                void toggleMediaActive(
                                  media,
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              {media.is_active
                                ? "Deactivate"
                                : "Restore"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ),
                  )
                )}
              </div>

              <form
                onSubmit={
                  submitMedia
                }
                className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="font-semibold text-slate-900">
                  Add media
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold text-slate-700">
                      Type
                    </span>

                    <select
                      value={
                        mediaForm.media_type
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            media_type:
                              event
                                .target
                                .value as
                                | "image"
                                | "video",
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    >
                      <option value="image">
                        Image
                      </option>

                      <option value="video">
                        Video
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-slate-700">
                      Sort order
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        mediaForm.sort_order
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            sort_order:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">
                      URL / public path
                    </span>

                    <input
                      value={
                        mediaForm.url
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            url:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="/resort/cottages/c01/front.jpg"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-slate-700">
                      Alt text
                    </span>

                    <input
                      value={
                        mediaForm.alt_text
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            alt_text:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-slate-700">
                      Caption
                    </span>

                    <input
                      value={
                        mediaForm.caption
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            caption:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={
                        mediaForm.is_cover
                      }
                      onChange={(
                        event,
                      ) =>
                        setMediaForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            is_cover:
                              event
                                .target
                                .checked,
                          }),
                        )
                      }
                    />

                    <span className="text-sm font-medium text-slate-700">
                      Make this the
                      cottage cover
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    mediaSaving
                  }
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {mediaSaving
                    ? "Adding..."
                    : "Add media"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Rooms
              </p>

              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Cottage rooms
              </h2>

              {roomTypeError && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {roomTypeError}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selected.rooms.map(
                  (room) => {
                    const assignedType =
                      roomTypes.find(
                        (roomType) =>
                          roomType.id ===
                          room.room_type_id,
                      ) ?? null;

                    return (
                      <div
                        key={room.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-sky-700">
                              {room.code}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {room.name}
                            </p>
                          </div>

                          <span className="text-xs font-medium text-slate-500">
                            {labelStatus(
                              room.status,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Room type
                            </span>

                            <select
                              value={
                                room.room_type_id ??
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                void handleRoomTypeAssignment(
                                  room.id,
                                  event.target.value,
                                )
                              }
                              disabled={
                                roomTypesLoading ||
                                roomTypeSavingId ===
                                  room.id
                              }
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">
                                Unassigned
                              </option>

                              {roomTypes.map(
                                (
                                  roomType,
                                ) => (
                                  <option
                                    key={
                                      roomType.id
                                    }
                                    value={
                                      roomType.id
                                    }
                                  >
                                    {
                                      roomType.name
                                    }{" "}
                                    ·{" "}
                                    {
                                      roomType.capacity
                                    }{" "}
                                    guests
                                  </option>
                                ),
                              )}
                            </select>
                          </label>

                          {roomTypeSavingId ===
                            room.id && (
                            <p className="mt-2 text-xs text-sky-700">
                              Saving assignment...
                            </p>
                          )}

                          {assignedType && (
                            <div className="mt-3 rounded-xl bg-sky-50 p-3">
                              <p className="text-xs font-semibold text-sky-800">
                                {
                                  assignedType.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-sky-700">
                                Capacity:{" "}
                                {
                                  assignedType.capacity
                                }{" "}
                                guests · Rates
                                managed in Pricing
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-xs leading-5 text-slate-400">
                          Legacy room capacity:{" "}
                          {room.capacity ??
                            "TBD"}
                          <br />
                          Legacy base rate:{" "}
                          {room.base_rate ??
                            "TBD"}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
