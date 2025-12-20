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
exports.SignUpDto = void 0;
// src/dto/auth/sign-up.ts
const class_validator_1 = require("class-validator");
let SignUpDto = (() => {
    var _a;
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _first_name_decorators;
    let _first_name_initializers = [];
    let _first_name_extraInitializers = [];
    let _last_name_decorators;
    let _last_name_initializers = [];
    let _last_name_extraInitializers = [];
    let _organization_type_decorators;
    let _organization_type_initializers = [];
    let _organization_type_extraInitializers = [];
    let _organization_name_decorators;
    let _organization_name_initializers = [];
    let _organization_name_extraInitializers = [];
    return _a = class SignUpDto {
            constructor() {
                this.email = __runInitializers(this, _email_initializers, void 0);
                this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                this.first_name = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _first_name_initializers, void 0));
                this.last_name = (__runInitializers(this, _first_name_extraInitializers), __runInitializers(this, _last_name_initializers, void 0));
                this.organization_type = (__runInitializers(this, _last_name_extraInitializers), __runInitializers(this, _organization_type_initializers, void 0)); // Si non spécifié -> HOUSE
                this.organization_name = (__runInitializers(this, _organization_type_extraInitializers), __runInitializers(this, _organization_name_initializers, void 0)); // Si non spécifié -> "Maison de {first_name}"
                __runInitializers(this, _organization_name_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsEmail)()];
            _password_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MinLength)(8), (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                })];
            _first_name_decorators = [(0, class_validator_1.IsNotEmpty)()];
            _last_name_decorators = [(0, class_validator_1.IsNotEmpty)()];
            _organization_type_decorators = [(0, class_validator_1.IsOptional)()];
            _organization_name_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _first_name_decorators, { kind: "field", name: "first_name", static: false, private: false, access: { has: obj => "first_name" in obj, get: obj => obj.first_name, set: (obj, value) => { obj.first_name = value; } }, metadata: _metadata }, _first_name_initializers, _first_name_extraInitializers);
            __esDecorate(null, null, _last_name_decorators, { kind: "field", name: "last_name", static: false, private: false, access: { has: obj => "last_name" in obj, get: obj => obj.last_name, set: (obj, value) => { obj.last_name = value; } }, metadata: _metadata }, _last_name_initializers, _last_name_extraInitializers);
            __esDecorate(null, null, _organization_type_decorators, { kind: "field", name: "organization_type", static: false, private: false, access: { has: obj => "organization_type" in obj, get: obj => obj.organization_type, set: (obj, value) => { obj.organization_type = value; } }, metadata: _metadata }, _organization_type_initializers, _organization_type_extraInitializers);
            __esDecorate(null, null, _organization_name_decorators, { kind: "field", name: "organization_name", static: false, private: false, access: { has: obj => "organization_name" in obj, get: obj => obj.organization_name, set: (obj, value) => { obj.organization_name = value; } }, metadata: _metadata }, _organization_name_initializers, _organization_name_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SignUpDto = SignUpDto;
