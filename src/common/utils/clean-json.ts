/** Mongoose toJSON transform: drop Mongo internals and any listed secret fields. */
export const cleanJson = (...hidden: string[]) => ({
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, any>) => {
    ret._id = undefined;
    for (const key of hidden) ret[key] = undefined;
    return ret;
  },
});

/** Next business id like ITEM-0001 from the highest existing numeric suffix. */
export const nextSequenceId = (
  existing: string[],
  prefix: string,
  pad: number,
): string => {
  const max = existing.reduce((m, id) => {
    const n = Number(String(id).replace(/\D/g, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
