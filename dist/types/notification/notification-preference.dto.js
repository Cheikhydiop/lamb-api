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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesByTypeDto = exports.BulkUpdatePreferencesDto = exports.BulkUpdatePreferenceItem = exports.NotificationPreferenceResponseDto = exports.UpdateNotificationPreferenceDto = exports.CreateNotificationPreferenceDto = void 0;
// src/dto/notification/notification-preference.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const notification_types_1 = require("../notification-types");
class CreateNotificationPreferenceDto {
    constructor() {
        this.enabled = true;
    }
}
exports.CreateNotificationPreferenceDto = CreateNotificationPreferenceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationType),
    __metadata("design:type", String)
], CreateNotificationPreferenceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateNotificationPreferenceDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], CreateNotificationPreferenceDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority),
    __metadata("design:type", String)
], CreateNotificationPreferenceDto.prototype, "minimumPriority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Quiet hours must be in HH:mm format',
    }),
    __metadata("design:type", String)
], CreateNotificationPreferenceDto.prototype, "quietHoursStart", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.quietHoursStart),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Quiet hours must be in HH:mm format',
    }),
    __metadata("design:type", String)
], CreateNotificationPreferenceDto.prototype, "quietHoursEnd", void 0);
class UpdateNotificationPreferenceDto {
}
exports.UpdateNotificationPreferenceDto = UpdateNotificationPreferenceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], UpdateNotificationPreferenceDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority),
    __metadata("design:type", String)
], UpdateNotificationPreferenceDto.prototype, "minimumPriority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Quiet hours must be in HH:mm format',
    }),
    __metadata("design:type", String)
], UpdateNotificationPreferenceDto.prototype, "quietHoursStart", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.quietHoursStart),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Quiet hours must be in HH:mm format',
    }),
    __metadata("design:type", String)
], UpdateNotificationPreferenceDto.prototype, "quietHoursEnd", void 0);
class NotificationPreferenceResponseDto {
}
exports.NotificationPreferenceResponseDto = NotificationPreferenceResponseDto;
class BulkUpdatePreferenceItem {
}
exports.BulkUpdatePreferenceItem = BulkUpdatePreferenceItem;
__decorate([
    (0, class_validator_1.IsEnum)(notification_types_1.NotificationType),
    __metadata("design:type", String)
], BulkUpdatePreferenceItem.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UpdateNotificationPreferenceDto),
    __metadata("design:type", UpdateNotificationPreferenceDto)
], BulkUpdatePreferenceItem.prototype, "preferences", void 0);
class BulkUpdatePreferencesDto {
}
exports.BulkUpdatePreferencesDto = BulkUpdatePreferencesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkUpdatePreferenceItem),
    __metadata("design:type", Array)
], BulkUpdatePreferencesDto.prototype, "updates", void 0);
class PreferencesByTypeDto {
}
exports.PreferencesByTypeDto = PreferencesByTypeDto;
