export const TIGER_TABLE_SLUGS = [
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  "tiger-plaza-outdoor-table-grey"
] as const;

export type TigerTableSlug = (typeof TIGER_TABLE_SLUGS)[number];
