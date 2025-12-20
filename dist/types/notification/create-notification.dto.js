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
exports.CreateNotificationDto = void 0;
const class_validator_1 = require("class-validator");
const notification_types_1 = require("../../types/notification-types");
let CreateNotificationDto = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _recipient_decorators;
    let _recipient_initializers = [];
    let _recipient_extraInitializers = [];
    let _organization_decorators;
    let _organization_initializers = [];
    let _organization_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _channels_decorators;
    let _channels_initializers = [];
    let _channels_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _requiresAcknowledgement_decorators;
    let _requiresAcknowledgement_initializers = [];
    let _requiresAcknowledgement_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    return _a = class CreateNotificationDto {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.recipient = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _recipient_initializers, void 0));
                this.organization = (__runInitializers(this, _recipient_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
                this.metadata = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                this.channels = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _channels_initializers, void 0));
                this.priority = (__runInitializers(this, _channels_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
                this.requiresAcknowledgement = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _requiresAcknowledgement_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _requiresAcknowledgement_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                __runInitializers(this, _expiresAt_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationType)];
            _recipient_decorators = [(0, class_validator_1.IsNotEmpty)()];
            _organization_decorators = [(0, class_validator_1.IsNotEmpty)()];
            _metadata_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _channels_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationChannel, { each: true })];
            _priority_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority)];
            _requiresAcknowledgement_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _expiresAt_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _recipient_decorators, { kind: "field", name: "recipient", static: false, private: false, access: { has: obj => "recipient" in obj, get: obj => obj.recipient, set: (obj, value) => { obj.recipient = value; } }, metadata: _metadata }, _recipient_initializers, _recipient_extraInitializers);
            __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: obj => "organization" in obj, get: obj => obj.organization, set: (obj, value) => { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _channels_decorators, { kind: "field", name: "channels", static: false, private: false, access: { has: obj => "channels" in obj, get: obj => obj.channels, set: (obj, value) => { obj.channels = value; } }, metadata: _metadata }, _channels_initializers, _channels_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _requiresAcknowledgement_decorators, { kind: "field", name: "requiresAcknowledgement", static: false, private: false, access: { has: obj => "requiresAcknowledgement" in obj, get: obj => obj.requiresAcknowledgement, set: (obj, value) => { obj.requiresAcknowledgement = value; } }, metadata: _metadata }, _requiresAcknowledgement_initializers, _requiresAcknowledgement_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateNotificationDto = CreateNotificationDto;
