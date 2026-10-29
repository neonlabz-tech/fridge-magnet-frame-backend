"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = exports.nextSequenceId = exports.cleanJson = void 0;
const cleanJson = (...hidden) => ({
    versionKey: false,
    transform: (_doc, ret) => {
        ret._id = undefined;
        for (const key of hidden)
            ret[key] = undefined;
        return ret;
    },
});
exports.cleanJson = cleanJson;
const nextSequenceId = (existing, prefix, pad) => {
    const max = existing.reduce((m, id) => {
        const n = Number(String(id).replace(/\D/g, ''));
        return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};
exports.nextSequenceId = nextSequenceId;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.escapeRegex = escapeRegex;
//# sourceMappingURL=clean-json.js.map