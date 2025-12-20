"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGroupType = exports.NotificationStatus = exports.NotificationPriority = exports.NotificationChannel = exports.NotificationType = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return client_1.NotificationType; } });
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["WEB"] = "WEB";
    NotificationChannel["WHATSAPP"] = "WHATSAPP";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["CRITICAL"] = "CRITICAL";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["DELIVERED"] = "DELIVERED";
    NotificationStatus["READ"] = "READ";
    NotificationStatus["FAILED"] = "FAILED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var NotificationGroupType;
(function (NotificationGroupType) {
    NotificationGroupType["SYSTEM"] = "SYSTEM";
    NotificationGroupType["USER"] = "USER";
    NotificationGroupType["MARKETING"] = "MARKETING";
})(NotificationGroupType || (exports.NotificationGroupType = NotificationGroupType = {}));
