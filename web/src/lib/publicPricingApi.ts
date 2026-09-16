export type PublicRoomRate = {
  rate_plan:
    | "with_breakfast"
    | "without_breakfast";
  amount: string | number;
};

export type PublicRoomTypePricing = {
  id: number;
  code: string;
  name: string;
  capacity: number;
  rates: PublicRoomRate[];
};

export type PublicExtraCharge = {
  id: number;
  code: string;
  name: string;
  amount: string | number;
};

export type PublicPricingCatalog = {
  roomTypes: PublicRoomTypePricing[];
  extraCharges: PublicExtraCharge[];
};

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:8001";


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
      `Sea Waves pricing request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}


export async function getPublicPricing(): Promise<
  PublicPricingCatalog
> {
  const [
    roomTypes,
    extraCharges,
  ] = await Promise.all([
    fetchApi<PublicRoomTypePricing[]>(
      "/pricing/room-types",
    ),
    fetchApi<PublicExtraCharge[]>(
      "/pricing/extra-charges",
    ),
  ]);

  return {
    roomTypes,
    extraCharges,
  };
}
