import type {
  MapLocationType,
  PropertyMapLocation,
} from "@/components/property-map/types";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:8001";

type DecimalValue = string | number | null;

type CottageApiResponse = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  capacity: number | null;
  base_rate: DecimalValue;
  status: string;
  is_active: boolean;
  map_x: DecimalValue;
  map_y: DecimalValue;
};

type AmenityApiResponse = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  map_x: DecimalValue;
  map_y: DecimalValue;
};

function toNumber(
  value: DecimalValue,
): number | null {
  if (value === null) {
    return null;
  }

  const converted = Number(value);

  if (!Number.isFinite(converted)) {
    return null;
  }

  return converted;
}

function getAmenityType(
  code: string,
): MapLocationType | null {
  switch (code) {
    case "SWIMMING_POOL":
      return "pool";

    case "EVENT_HALL":
      return "event_hall";

    case "BILLIARDS":
      return "billiards";

    case "BEACH_ACCESS":
      return "beach";

    case "MAIN_ENTRANCE":
      return "entrance";

    default:
      return null;
  }
}

async function fetchApi<T>(
  path: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Sea Waves API request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getPropertyMapLocations(): Promise<
  PropertyMapLocation[]
> {
  const [cottages, amenities] =
    await Promise.all([
      fetchApi<CottageApiResponse[]>("/cottages"),
      fetchApi<AmenityApiResponse[]>("/amenities"),
    ]);

  const cottageLocations: PropertyMapLocation[] =
    cottages.flatMap((cottage) => {
      const x = toNumber(cottage.map_x);
      const y = toNumber(cottage.map_y);

      if (x === null || y === null) {
        return [];
      }

      return [
        {
          id: `cottage-${cottage.id}`,
          databaseId: cottage.id,
          name: cottage.name,
          type: "cottage",
          description:
            cottage.description ??
            "Cottage information will be available soon.",
          status: cottage.status,
          x,
          y,
        },
      ];
    });

  const amenityLocations: PropertyMapLocation[] =
    amenities.flatMap((amenity) => {
      const type = getAmenityType(
        amenity.code,
      );

      const x = toNumber(amenity.map_x);
      const y = toNumber(amenity.map_y);

      if (
        type === null ||
        x === null ||
        y === null
      ) {
        return [];
      }

      return [
        {
          id: `amenity-${amenity.id}`,
          databaseId: amenity.id,
          name: amenity.name,
          type,
          description:
            amenity.description ??
            "More information will be available soon.",
          x,
          y,
        },
      ];
    });

  return [
    ...amenityLocations,
    ...cottageLocations,
  ];
}