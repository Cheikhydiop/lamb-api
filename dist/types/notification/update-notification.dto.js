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
exports.UpdateNotificationDto = void 0;
const class_validator_1 = require("class-validator");
const notification_types_1 = require("../../types/notification-types");
// src/dto/notification/update-notification.dto.ts
let UpdateNotificationDto = (() => {
    var _a;
    let _read_decorators;
    let _read_initializers = [];
    let _read_extraInitializers = [];
    let _acknowledged_decorators;
    let _acknowledged_initializers = [];
    let _acknowledged_extraInitializers = [];
    let _channels_decorators;
    let _channels_initializers = [];
    let _channels_extraInitializers = [];
    return _a = class UpdateNotificationDto {
            constructor() {
                this.read = __runInitializers(this, _read_initializers, void 0);
                this.acknowledged = (__runInitializers(this, _read_extraInitializers), __runInitializers(this, _acknowledged_initializers, void 0));
                this.channels = (__runInitializers(this, _acknowledged_extraInitializers), __runInitializers(this, _channels_initializers, void 0));
                __runInitializers(this, _channels_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _read_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _acknowledged_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _channels_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true })];
            __esDecorate(null, null, _read_decorators, { kind: "field", name: "read", static: false, private: false, access: { has: obj => "read" in obj, get: obj => obj.read, set: (obj, value) => { obj.read = value; } }, metadata: _metadata }, _read_initializers, _read_extraInitializers);
            __esDecorate(null, null, _acknowledged_decorators, { kind: "field", name: "acknowledged", static: false, private: false, access: { has: obj => "acknowledged" in obj, get: obj => obj.acknowledged, set: (obj, value) => { obj.acknowledged = value; } }, metadata: _metadata }, _acknowledged_initializers, _acknowledged_extraInitializers);
            __esDecorate(null, null, _channels_decorators, { kind: "field", name: "channels", static: false, private: false, access: { has: obj => "channels" in obj, get: obj => obj.channels, set: (obj, value) => { obj.channels = value; } }, metadata: _metadata }, _channels_initializers, _channels_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateNotificationDto = UpdateNotificationDto;
