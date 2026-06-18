export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 999_999_999;
export const SPLIT_TYPE = { EQUAL: 'EQUAL', CUSTOM: 'CUSTOM' } as const;
export type SplitType = typeof SPLIT_TYPE[keyof typeof SPLIT_TYPE];
