export type MapLocationType =
  | "cottage"
  | "pool"
  | "event_hall"
  | "billiards"
  | "beach"
  | "entrance";

export type PropertyMapLocation = {
  id: string;
  databaseId?: number;
  name: string;
  type: MapLocationType;
  description?: string;
  status?: string;
  x: number;
  y: number;
  isDraft?: boolean;
};