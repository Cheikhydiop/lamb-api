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
exports.ChangePasswordDto = void 0;
// src/dto/auth/change-password.dto.ts
const class_validator_1 = require("class-validator");
let ChangePasswordDto = (() => {
    var _a;
    let _current_password_decorators;
    let _current_password_initializers = [];
    let _current_password_extraInitializers = [];
    let _new_password_decorators;
    let _new_password_initializers = [];
    let _new_password_extraInitializers = [];
    return _a = class ChangePasswordDto {
            constructor() {
                this.current_password = __runInitializers(this, _current_password_initializers, void 0);
                this.new_password = (__runInitializers(this, _current_password_extraInitializers), __runInitializers(this, _new_password_initializers, void 0));
                __runInitializers(this, _new_password_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _current_password_decorators = [(0, class_validator_1.IsNotEmpty)()];
            _new_password_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MinLength)(8), (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
                    message: 'Le nouveau mot de passe doit contenir au moins une lettre minuscule, une majuscule et un chiffre',
                })];
            __esDecorate(null, null, _current_password_decorators, { kind: "field", name: "current_password", static: false, private: false, access: { has: obj => "current_password" in obj, get: obj => obj.current_password, set: (obj, value) => { obj.current_password = value; } }, metadata: _metadata }, _current_password_initializers, _current_password_extraInitializers);
            __esDecorate(null, null, _new_password_decorators, { kind: "field", name: "new_password", static: false, private: false, access: { has: obj => "new_password" in obj, get: obj => obj.new_password, set: (obj, value) => { obj.new_password = value; } }, metadata: _metadata }, _new_password_initializers, _new_password_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ChangePasswordDto = ChangePasswordDto;
