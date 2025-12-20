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
// src/dto/notification/notification.dto.ts
const class_validator_1 = require("class-validator");
const notification_types_1 = require("../../types/notification-types");
let CreateNotificationDto = (() => {
    var _a;
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _recipientId_decorators;
    let _recipientId_initializers = [];
    let _recipientId_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _requiresAcknowledgement_decorators;
    let _requiresAcknowledgement_initializers = [];
    let _requiresAcknowledgement_extraInitializers = [];
    let _groupType_decorators;
    let _groupType_initializers = [];
    let _groupType_extraInitializers = [];
    let _groupId_decorators;
    let _groupId_initializers = [];
    let _groupId_extraInitializers = [];
    return _a = class CreateNotificationDto {
            constructor() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.title = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.message = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _message_initializers, void 0));
                this.recipientId = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _recipientId_initializers, void 0));
                this.metadata = (__runInitializers(this, _recipientId_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                this.priority = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
                this.requiresAcknowledgement = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _requiresAcknowledgement_initializers, void 0));
                this.groupType = (__runInitializers(this, _requiresAcknowledgement_extraInitializers), __runInitializers(this, _groupType_initializers, void 0));
                this.groupId = (__runInitializers(this, _groupType_extraInitializers), __runInitializers(this, _groupId_initializers, void 0));
                __runInitializers(this, _groupId_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationType)];
            _title_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _message_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _recipientId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _metadata_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            _priority_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationPriority)];
            _requiresAcknowledgement_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _groupType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationGroupType)];
            _groupId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _recipientId_decorators, { kind: "field", name: "recipientId", static: false, private: false, access: { has: obj => "recipientId" in obj, get: obj => obj.recipientId, set: (obj, value) => { obj.recipientId = value; } }, metadata: _metadata }, _recipientId_initializers, _recipientId_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _requiresAcknowledgement_decorators, { kind: "field", name: "requiresAcknowledgement", static: false, private: false, access: { has: obj => "requiresAcknowledgement" in obj, get: obj => obj.requiresAcknowledgement, set: (obj, value) => { obj.requiresAcknowledgement = value; } }, metadata: _metadata }, _requiresAcknowledgement_initializers, _requiresAcknowledgement_extraInitializers);
            __esDecorate(null, null, _groupType_decorators, { kind: "field", name: "groupType", static: false, private: false, access: { has: obj => "groupType" in obj, get: obj => obj.groupType, set: (obj, value) => { obj.groupType = value; } }, metadata: _metadata }, _groupType_initializers, _groupType_extraInitializers);
            __esDecorate(null, null, _groupId_decorators, { kind: "field", name: "groupId", static: false, private: false, access: { has: obj => "groupId" in obj, get: obj => obj.groupId, set: (obj, value) => { obj.groupId = value; } }, metadata: _metadata }, _groupId_initializers, _groupId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateNotificationDto = CreateNotificationDto;
