export const roles = ["admin", "volunteer"] as const;

export type Role = (typeof roles)[number];
