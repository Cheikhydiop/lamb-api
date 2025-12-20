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
exports.UpdateUserDto = void 0;
// src/dto/auth/update-user.dto.ts
const class_validator_1 = require("class-validator");
const User_1 = require("../../entity/User");
let UpdateUserDto = (() => {
    var _a;
    let _first_name_decorators;
    let _first_name_initializers = [];
    let _first_name_extraInitializers = [];
    let _last_name_decorators;
    let _last_name_initializers = [];
    let _last_name_extraInitializers = [];
    let _phone_number_decorators;
    let _phone_number_initializers = [];
    let _phone_number_extraInitializers = [];
    let _preferred_language_decorators;
    let _preferred_language_initializers = [];
    let _preferred_language_extraInitializers = [];
    return _a = class UpdateUserDto {
            constructor() {
                this.first_name = __runInitializers(this, _first_name_initializers, void 0);
                this.last_name = (__runInitializers(this, _first_name_extraInitializers), __runInitializers(this, _last_name_initializers, void 0));
                this.phone_number = (__runInitializers(this, _last_name_extraInitializers), __runInitializers(this, _phone_number_initializers, void 0));
                this.preferred_language = (__runInitializers(this, _phone_number_extraInitializers), __runInitializers(this, _preferred_language_initializers, void 0));
                __runInitializers(this, _preferred_language_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _first_name_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 100)];
            _last_name_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 100)];
            _phone_number_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsPhoneNumber)(undefined, {
                    message: "Le numéro de téléphone doit inclure l'indicatif du pays (ex: +221xxxxxxxxx ou +33xxxxxxxxx)",
                })];
            _preferred_language_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(User_1.Language)];
            __esDecorate(null, null, _first_name_decorators, { kind: "field", name: "first_name", static: false, private: false, access: { has: obj => "first_name" in obj, get: obj => obj.first_name, set: (obj, value) => { obj.first_name = value; } }, metadata: _metadata }, _first_name_initializers, _first_name_extraInitializers);
            __esDecorate(null, null, _last_name_decorators, { kind: "field", name: "last_name", static: false, private: false, access: { has: obj => "last_name" in obj, get: obj => obj.last_name, set: (obj, value) => { obj.last_name = value; } }, metadata: _metadata }, _last_name_initializers, _last_name_extraInitializers);
            __esDecorate(null, null, _phone_number_decorators, { kind: "field", name: "phone_number", static: false, private: false, access: { has: obj => "phone_number" in obj, get: obj => obj.phone_number, set: (obj, value) => { obj.phone_number = value; } }, metadata: _metadata }, _phone_number_initializers, _phone_number_extraInitializers);
            __esDecorate(null, null, _preferred_language_decorators, { kind: "field", name: "preferred_language", static: false, private: false, access: { has: obj => "preferred_language" in obj, get: obj => obj.preferred_language, set: (obj, value) => { obj.preferred_language = value; } }, metadata: _metadata }, _preferred_language_initializers, _preferred_language_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateUserDto = UpdateUserDto;
