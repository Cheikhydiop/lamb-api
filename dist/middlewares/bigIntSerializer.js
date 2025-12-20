"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigIntSerializer = void 0;
const bigIntSerializer = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        const jsonString = JSON.stringify(data, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString(); // Convertir BigInt en string
            }
            if (value instanceof Date) {
                return value.toISOString(); // Formater les dates
            }
            return value;
        });
        res.setHeader('Content-Type', 'application/json');
        return res.send(jsonString);
    };
    next();
};
exports.bigIntSerializer = bigIntSerializer;
