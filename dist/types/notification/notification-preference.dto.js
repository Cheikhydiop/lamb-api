"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesByTypeDto = exports.BulkUpdatePreferencesDto = exports.BulkUpdatePreferenceItem = exports.NotificationPreferenceResponseDto = exports.UpdateNotificationPreferenceDto = exports.CreateNotificationPreferenceDto = void 0;
// src/dto/notification/notification-preference.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const notification_types_1 = require("../../types/notification-types");
let CreateNotificationPreferenceDto = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _channels_decorators;
    let _channels_initializers = [];
    let _channels_extraInitializers = [];
    let _enabled_decorators;
    let _enabled_initializers = [];
    let _enabled_extraInitializers = [];
    let _minimumPriority_decorators;
    let _minimumPriority_initializers = [];
    let _minimumPriority_extraInitializers = [];
    let _quietHoursStart_decorators;
    let _quietHoursStart_initializers = [];
    let _quietHoursStart_extraInitializers = [];
    let _quietHoursEnd_decorators;
    let _quietHoursEnd_initializers = [];
    let _quietHoursEnd_extraInitializers = [];
    return _a = class CreateNotificationPreferenceDto {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.channels = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _channels_initializers, void 0));
                this.enabled = (__runInitializers(this, _channels_extraInitializers), __runInitializers(this, _enabled_initializers, true));
                this.minimumPriority = (__runInitializers(this, _enabled_extraInitializers), __runInitializers(this, _minimumPriority_initializers, void 0));
                this.quietHoursStart = (__runInitializers(this, _minimumPriority_extraInitializers), __runInitializers(this, _quietHoursStart_initializers, void 0));
                this.quietHoursEnd = (__runInitializers(this, _quietHoursStart_extraInitializers), __runInitializers(this, _quietHoursEnd_initializers, void 0));
                __runInitializers(this, _quietHoursEnd_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationType)];
            _channels_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true })];
            _enabled_decorators = [(0, class_validator_1.IsBoolean)()];
            _minimumPriority_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority)];
            _quietHoursStart_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: 'Quiet hours must be in HH:mm format',
                })];
            _quietHoursEnd_decorators = [(0, class_validator_1.ValidateIf)((o) => o.quietHoursStart), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: 'Quiet hours must be in HH:mm format',
                })];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _channels_decorators, { kind: "field", name: "channels", static: false, private: false, access: { has: obj => "channels" in obj, get: obj => obj.channels, set: (obj, value) => { obj.channels = value; } }, metadata: _metadata }, _channels_initializers, _channels_extraInitializers);
            __esDecorate(null, null, _enabled_decorators, { kind: "field", name: "enabled", static: false, private: false, access: { has: obj => "enabled" in obj, get: obj => obj.enabled, set: (obj, value) => { obj.enabled = value; } }, metadata: _metadata }, _enabled_initializers, _enabled_extraInitializers);
            __esDecorate(null, null, _minimumPriority_decorators, { kind: "field", name: "minimumPriority", static: false, private: false, access: { has: obj => "minimumPriority" in obj, get: obj => obj.minimumPriority, set: (obj, value) => { obj.minimumPriority = value; } }, metadata: _metadata }, _minimumPriority_initializers, _minimumPriority_extraInitializers);
            __esDecorate(null, null, _quietHoursStart_decorators, { kind: "field", name: "quietHoursStart", static: false, private: false, access: { has: obj => "quietHoursStart" in obj, get: obj => obj.quietHoursStart, set: (obj, value) => { obj.quietHoursStart = value; } }, metadata: _metadata }, _quietHoursStart_initializers, _quietHoursStart_extraInitializers);
            __esDecorate(null, null, _quietHoursEnd_decorators, { kind: "field", name: "quietHoursEnd", static: false, private: false, access: { has: obj => "quietHoursEnd" in obj, get: obj => obj.quietHoursEnd, set: (obj, value) => { obj.quietHoursEnd = value; } }, metadata: _metadata }, _quietHoursEnd_initializers, _quietHoursEnd_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateNotificationPreferenceDto = CreateNotificationPreferenceDto;
let UpdateNotificationPreferenceDto = (() => {
    var _a;
    let _channels_decorators;
    let _channels_initializers = [];
    let _channels_extraInitializers = [];
    let _enabled_decorators;
    let _enabled_initializers = [];
    let _enabled_extraInitializers = [];
    let _minimumPriority_decorators;
    let _minimumPriority_initializers = [];
    let _minimumPriority_extraInitializers = [];
    let _quietHoursStart_decorators;
    let _quietHoursStart_initializers = [];
    let _quietHoursStart_extraInitializers = [];
    let _quietHoursEnd_decorators;
    let _quietHoursEnd_initializers = [];
    let _quietHoursEnd_extraInitializers = [];
    return _a = class UpdateNotificationPreferenceDto {
            constructor() {
                this.channels = __runInitializers(this, _channels_initializers, void 0);
                this.enabled = (__runInitializers(this, _channels_extraInitializers), __runInitializers(this, _enabled_initializers, void 0));
                this.minimumPriority = (__runInitializers(this, _enabled_extraInitializers), __runInitializers(this, _minimumPriority_initializers, void 0));
                this.quietHoursStart = (__runInitializers(this, _minimumPriority_extraInitializers), __runInitializers(this, _quietHoursStart_initializers, void 0));
                this.quietHoursEnd = (__runInitializers(this, _quietHoursStart_extraInitializers), __runInitializers(this, _quietHoursEnd_initializers, void 0));
                __runInitializers(this, _quietHoursEnd_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _channels_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true })];
            _enabled_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _minimumPriority_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority)];
            _quietHoursStart_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: 'Quiet hours must be in HH:mm format',
                })];
            _quietHoursEnd_decorators = [(0, class_validator_1.ValidateIf)((o) => o.quietHoursStart), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
                    message: 'Quiet hours must be in HH:mm format',
                })];
            __esDecorate(null, null, _channels_decorators, { kind: "field", name: "channels", static: false, private: false, access: { has: obj => "channels" in obj, get: obj => obj.channels, set: (obj, value) => { obj.channels = value; } }, metadata: _metadata }, _channels_initializers, _channels_extraInitializers);
            __esDecorate(null, null, _enabled_decorators, { kind: "field", name: "enabled", static: false, private: false, access: { has: obj => "enabled" in obj, get: obj => obj.enabled, set: (obj, value) => { obj.enabled = value; } }, metadata: _metadata }, _enabled_initializers, _enabled_extraInitializers);
            __esDecorate(null, null, _minimumPriority_decorators, { kind: "field", name: "minimumPriority", static: false, private: false, access: { has: obj => "minimumPriority" in obj, get: obj => obj.minimumPriority, set: (obj, value) => { obj.minimumPriority = value; } }, metadata: _metadata }, _minimumPriority_initializers, _minimumPriority_extraInitializers);
            __esDecorate(null, null, _quietHoursStart_decorators, { kind: "field", name: "quietHoursStart", static: false, private: false, access: { has: obj => "quietHoursStart" in obj, get: obj => obj.quietHoursStart, set: (obj, value) => { obj.quietHoursStart = value; } }, metadata: _metadata }, _quietHoursStart_initializers, _quietHoursStart_extraInitializers);
            __esDecorate(null, null, _quietHoursEnd_decorators, { kind: "field", name: "quietHoursEnd", static: false, private: false, access: { has: obj => "quietHoursEnd" in obj, get: obj => obj.quietHoursEnd, set: (obj, value) => { obj.quietHoursEnd = value; } }, metadata: _metadata }, _quietHoursEnd_initializers, _quietHoursEnd_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateNotificationPreferenceDto = UpdateNotificationPreferenceDto;
class NotificationPreferenceResponseDto {
}
exports.NotificationPreferenceResponseDto = NotificationPreferenceResponseDto;
let BulkUpdatePreferenceItem = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _preferences_decorators;
    let _preferences_initializers = [];
    let _preferences_extraInitializers = [];
    return _a = class BulkUpdatePreferenceItem {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.preferences = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _preferences_initializers, void 0));
                __runInitializers(this, _preferences_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsEnum)(notification_types_1.NotificationType)];
            _preferences_decorators = [(0, class_validator_1.ValidateNested)(), (0, class_transformer_1.Type)(() => UpdateNotificationPreferenceDto)];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _preferences_decorators, { kind: "field", name: "preferences", static: false, private: false, access: { has: obj => "preferences" in obj, get: obj => obj.preferences, set: (obj, value) => { obj.preferences = value; } }, metadata: _metadata }, _preferences_initializers, _preferences_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.BulkUpdatePreferenceItem = BulkUpdatePreferenceItem;
let BulkUpdatePreferencesDto = (() => {
    var _a;
    let _updates_decorators;
    let _updates_initializers = [];
    let _updates_extraInitializers = [];
    return _a = class BulkUpdatePreferencesDto {
            constructor() {
                this.updates = __runInitializers(this, _updates_initializers, void 0);
                __runInitializers(this, _updates_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _updates_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(() => BulkUpdatePreferenceItem)];
            __esDecorate(null, null, _updates_decorators, { kind: "field", name: "updates", static: false, private: false, access: { has: obj => "updates" in obj, get: obj => obj.updates, set: (obj, value) => { obj.updates = value; } }, metadata: _metadata }, _updates_initializers, _updates_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.BulkUpdatePreferencesDto = BulkUpdatePreferencesDto;
class PreferencesByTypeDto {
}
exports.PreferencesByTypeDto = PreferencesByTypeDto;
