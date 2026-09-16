"use client";

type Props = {
  roomTypeId: number;
  roomTypeName: string;
};

export default function BookRoomTypeButton({
  roomTypeId,
  roomTypeName,
}: Props) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent(
        "sea-waves:select-room-type",
        {
          detail: {
            roomTypeId,
          },
        },
      ),
    );

    document
      .getElementById("book")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Book ${roomTypeName}`}
      className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Book this room type
    </button>
  );
}
