"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNotificationDto = void 0;
const class_validator_1 = require("class-validator");
const notification_types_1 = require("../../types/notification-types");
const User_1 = require("../../entity/User");
const Organization_1 = require("../../entity/Organization");
class CreateNotificationDto {
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationType),
    __metadata("design:type", typeof (_a = typeof notification_types_1.NotificationType !== "undefined" && notification_types_1.NotificationType) === "function" ? _a : Object)
], CreateNotificationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_b = typeof User_1.User !== "undefined" && User_1.User) === "function" ? _b : Object)
], CreateNotificationDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_c = typeof Organization_1.Organization !== "undefined" && Organization_1.Organization) === "function" ? _c : Object)
], CreateNotificationDto.prototype, "organization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", typeof (_d = typeof notification_types_1.NotificationMetadata !== "undefined" && notification_types_1.NotificationMetadata) === "function" ? _d : Object)
], CreateNotificationDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateNotificationDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority),
    __metadata("design:type", typeof (_e = typeof notification_types_1.NotificationPriority !== "undefined" && notification_types_1.NotificationPriority) === "function" ? _e : Object)
], CreateNotificationDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNotificationDto.prototype, "requiresAcknowledgement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateNotificationDto.prototype, "expiresAt", void 0);
