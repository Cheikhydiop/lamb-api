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
exports.NotificationFiltersDto = void 0;
// src/dto/notification/notification-filters.dto.ts
const class_validator_1 = require("class-validator");
const notification_types_1 = require("../../types/notification-types");
let NotificationFiltersDto = (() => {
    var _a;
    let _read_decorators;
    let _read_initializers = [];
    let _read_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _types_decorators;
    let _types_initializers = [];
    let _types_extraInitializers = [];
    let _from_decorators;
    let _from_initializers = [];
    let _from_extraInitializers = [];
    let _to_decorators;
    let _to_initializers = [];
    let _to_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _requiresAcknowledgement_decorators;
    let _requiresAcknowledgement_initializers = [];
    let _requiresAcknowledgement_extraInitializers = [];
    let _groupType_decorators;
    let _groupType_initializers = [];
    let _groupType_extraInitializers = [];
    let _limit_decorators;
    let _limit_initializers = [];
    let _limit_extraInitializers = [];
    let _offset_decorators;
    let _offset_initializers = [];
    let _offset_extraInitializers = [];
    let _order_decorators;
    let _order_initializers = [];
    let _order_extraInitializers = [];
    return _a = class NotificationFiltersDto {
            constructor() {
                this.read = __runInitializers(this, _read_initializers, void 0);
                this.status = (__runInitializers(this, _read_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.types = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _types_initializers, void 0));
                this.from = (__runInitializers(this, _types_extraInitializers), __runInitializers(this, _from_initializers, void 0));
                this.to = (__runInitializers(this, _from_extraInitializers), __runInitializers(this, _to_initializers, void 0));
                this.priority = (__runInitializers(this, _to_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
                this.requiresAcknowledgement = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _requiresAcknowledgement_initializers, void 0));
                this.groupType = (__runInitializers(this, _requiresAcknowledgement_extraInitializers), __runInitializers(this, _groupType_initializers, void 0));
                this.limit = (__runInitializers(this, _groupType_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                this.offset = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _offset_initializers, void 0));
                this.order = (__runInitializers(this, _offset_extraInitializers), __runInitializers(this, _order_initializers, void 0));
                __runInitializers(this, _order_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _read_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _status_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationStatus, { each: true })];
            _types_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationType, { each: true })];
            _from_decorators = [(0, class_validator_1.IsOptional)()];
            _to_decorators = [(0, class_validator_1.IsOptional)()];
            _priority_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _requiresAcknowledgement_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _groupType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(notification_types_1.NotificationGroupType)];
            _limit_decorators = [(0, class_validator_1.IsOptional)()];
            _offset_decorators = [(0, class_validator_1.IsOptional)()];
            _order_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _read_decorators, { kind: "field", name: "read", static: false, private: false, access: { has: obj => "read" in obj, get: obj => obj.read, set: (obj, value) => { obj.read = value; } }, metadata: _metadata }, _read_initializers, _read_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _types_decorators, { kind: "field", name: "types", static: false, private: false, access: { has: obj => "types" in obj, get: obj => obj.types, set: (obj, value) => { obj.types = value; } }, metadata: _metadata }, _types_initializers, _types_extraInitializers);
            __esDecorate(null, null, _from_decorators, { kind: "field", name: "from", static: false, private: false, access: { has: obj => "from" in obj, get: obj => obj.from, set: (obj, value) => { obj.from = value; } }, metadata: _metadata }, _from_initializers, _from_extraInitializers);
            __esDecorate(null, null, _to_decorators, { kind: "field", name: "to", static: false, private: false, access: { has: obj => "to" in obj, get: obj => obj.to, set: (obj, value) => { obj.to = value; } }, metadata: _metadata }, _to_initializers, _to_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _requiresAcknowledgement_decorators, { kind: "field", name: "requiresAcknowledgement", static: false, private: false, access: { has: obj => "requiresAcknowledgement" in obj, get: obj => obj.requiresAcknowledgement, set: (obj, value) => { obj.requiresAcknowledgement = value; } }, metadata: _metadata }, _requiresAcknowledgement_initializers, _requiresAcknowledgement_extraInitializers);
            __esDecorate(null, null, _groupType_decorators, { kind: "field", name: "groupType", static: false, private: false, access: { has: obj => "groupType" in obj, get: obj => obj.groupType, set: (obj, value) => { obj.groupType = value; } }, metadata: _metadata }, _groupType_initializers, _groupType_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: obj => "limit" in obj, get: obj => obj.limit, set: (obj, value) => { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: obj => "offset" in obj, get: obj => obj.offset, set: (obj, value) => { obj.offset = value; } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
            __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: obj => "order" in obj, get: obj => obj.order, set: (obj, value) => { obj.order = value; } }, metadata: _metadata }, _order_initializers, _order_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.NotificationFiltersDto = NotificationFiltersDto;
