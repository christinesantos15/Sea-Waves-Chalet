export type MapLocationType =
  | "cottage"
  | "pool"
  | "event_hall"
  | "billiards"
  | "beach"
  | "entrance";

export type PropertyMapLocation = {
  id: string;
  name: string;
  type: MapLocationType;
  description?: string;
  x: number;
  y: number;
  isDraft?: boolean;
};