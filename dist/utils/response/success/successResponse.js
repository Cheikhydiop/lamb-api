"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
express_1.response.successResponse = function (data) {
    return this.status(200).send(data);
};
