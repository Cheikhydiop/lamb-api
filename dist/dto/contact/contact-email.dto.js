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
exports.ContactEmailDto = void 0;
const class_validator_1 = require("class-validator");
let ContactEmailDto = (() => {
    var _a;
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _subject_decorators;
    let _subject_initializers = [];
    let _subject_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _company_decorators;
    let _company_initializers = [];
    let _company_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    return _a = class ContactEmailDto {
            constructor() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.email = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.subject = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _subject_initializers, void 0));
                this.message = (__runInitializers(this, _subject_extraInitializers), __runInitializers(this, _message_initializers, void 0));
                this.company = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _company_initializers, void 0));
                this.phone = (__runInitializers(this, _company_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
                __runInitializers(this, _phone_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsNotEmpty)({ message: 'Name is required' }), (0, class_validator_1.IsString)({ message: 'Name must be a string' }), (0, class_validator_1.MaxLength)(100, { message: 'Name cannot exceed 100 characters' })];
            _email_decorators = [(0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }), (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' })];
            _subject_decorators = [(0, class_validator_1.IsNotEmpty)({ message: 'Subject is required' }), (0, class_validator_1.IsString)({ message: 'Subject must be a string' }), (0, class_validator_1.MaxLength)(200, { message: 'Subject cannot exceed 200 characters' })];
            _message_decorators = [(0, class_validator_1.IsNotEmpty)({ message: 'Message is required' }), (0, class_validator_1.IsString)({ message: 'Message must be a string' }), (0, class_validator_1.MinLength)(10, { message: 'Message must be at least 10 characters long' }), (0, class_validator_1.MaxLength)(2000, { message: 'Message cannot exceed 2000 characters' })];
            _company_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)({ message: 'Company must be a string' }), (0, class_validator_1.MaxLength)(100, { message: 'Company name cannot exceed 100 characters' })];
            _phone_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)({ message: 'Phone must be a string' }), (0, class_validator_1.MaxLength)(20, { message: 'Phone number cannot exceed 20 characters' })];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _subject_decorators, { kind: "field", name: "subject", static: false, private: false, access: { has: obj => "subject" in obj, get: obj => obj.subject, set: (obj, value) => { obj.subject = value; } }, metadata: _metadata }, _subject_initializers, _subject_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _company_decorators, { kind: "field", name: "company", static: false, private: false, access: { has: obj => "company" in obj, get: obj => obj.company, set: (obj, value) => { obj.company = value; } }, metadata: _metadata }, _company_initializers, _company_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ContactEmailDto = ContactEmailDto;
