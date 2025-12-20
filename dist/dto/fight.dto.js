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
exports.ListDayEventsDTO = exports.UpdateDayEventDTO = exports.CreateDayEventDTO = exports.FightInDayEventDTO = exports.ListFightsDTO = exports.ValidateFightResultDTO = exports.UpdateFightStatusDTO = exports.CreateFightDTO = void 0;
// src/dto/fight.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
let CreateFightDTO = (() => {
    var _a;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _location_decorators;
    let _location_initializers = [];
    let _location_extraInitializers = [];
    let _scheduledAt_decorators;
    let _scheduledAt_initializers = [];
    let _scheduledAt_extraInitializers = [];
    let _fighterAId_decorators;
    let _fighterAId_initializers = [];
    let _fighterAId_extraInitializers = [];
    let _fighterBId_decorators;
    let _fighterBId_initializers = [];
    let _fighterBId_extraInitializers = [];
    return _a = class CreateFightDTO {
            constructor() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.location = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                this.scheduledAt = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _scheduledAt_initializers, void 0));
                this.fighterAId = (__runInitializers(this, _scheduledAt_extraInitializers), __runInitializers(this, _fighterAId_initializers, void 0));
                this.fighterBId = (__runInitializers(this, _fighterAId_extraInitializers), __runInitializers(this, _fighterBId_initializers, void 0));
                __runInitializers(this, _fighterBId_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)()];
            _description_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _location_decorators = [(0, class_validator_1.IsString)()];
            _scheduledAt_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date)];
            _fighterAId_decorators = [(0, class_validator_1.IsUUID)()];
            _fighterBId_decorators = [(0, class_validator_1.IsUUID)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _scheduledAt_decorators, { kind: "field", name: "scheduledAt", static: false, private: false, access: { has: obj => "scheduledAt" in obj, get: obj => obj.scheduledAt, set: (obj, value) => { obj.scheduledAt = value; } }, metadata: _metadata }, _scheduledAt_initializers, _scheduledAt_extraInitializers);
            __esDecorate(null, null, _fighterAId_decorators, { kind: "field", name: "fighterAId", static: false, private: false, access: { has: obj => "fighterAId" in obj, get: obj => obj.fighterAId, set: (obj, value) => { obj.fighterAId = value; } }, metadata: _metadata }, _fighterAId_initializers, _fighterAId_extraInitializers);
            __esDecorate(null, null, _fighterBId_decorators, { kind: "field", name: "fighterBId", static: false, private: false, access: { has: obj => "fighterBId" in obj, get: obj => obj.fighterBId, set: (obj, value) => { obj.fighterBId = value; } }, metadata: _metadata }, _fighterBId_initializers, _fighterBId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateFightDTO = CreateFightDTO;
let UpdateFightStatusDTO = (() => {
    var _a;
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    return _a = class UpdateFightStatusDTO {
            constructor() {
                this.status = __runInitializers(this, _status_initializers, void 0);
                __runInitializers(this, _status_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, class_validator_1.IsString)()];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateFightStatusDTO = UpdateFightStatusDTO;
let ValidateFightResultDTO = (() => {
    var _a;
    let _fightId_decorators;
    let _fightId_initializers = [];
    let _fightId_extraInitializers = [];
    let _winner_decorators;
    let _winner_initializers = [];
    let _winner_extraInitializers = [];
    let _victoryMethod_decorators;
    let _victoryMethod_initializers = [];
    let _victoryMethod_extraInitializers = [];
    let _round_decorators;
    let _round_initializers = [];
    let _round_extraInitializers = [];
    let _duration_decorators;
    let _duration_initializers = [];
    let _duration_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _otpCode_decorators;
    let _otpCode_initializers = [];
    let _otpCode_extraInitializers = [];
    return _a = class ValidateFightResultDTO {
            constructor() {
                this.fightId = __runInitializers(this, _fightId_initializers, void 0);
                this.winner = (__runInitializers(this, _fightId_extraInitializers), __runInitializers(this, _winner_initializers, void 0));
                this.victoryMethod = (__runInitializers(this, _winner_extraInitializers), __runInitializers(this, _victoryMethod_initializers, void 0));
                this.round = (__runInitializers(this, _victoryMethod_extraInitializers), __runInitializers(this, _round_initializers, void 0));
                this.duration = (__runInitializers(this, _round_extraInitializers), __runInitializers(this, _duration_initializers, void 0));
                this.notes = (__runInitializers(this, _duration_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.password = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                this.otpCode = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _otpCode_initializers, void 0));
                __runInitializers(this, _otpCode_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fightId_decorators = [(0, class_validator_1.IsUUID)()];
            _winner_decorators = [(0, class_validator_1.IsString)()];
            _victoryMethod_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _round_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(15)];
            _duration_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _notes_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _password_decorators = [(0, class_validator_1.IsString)()];
            _otpCode_decorators = [(0, class_validator_1.IsString)()];
            __esDecorate(null, null, _fightId_decorators, { kind: "field", name: "fightId", static: false, private: false, access: { has: obj => "fightId" in obj, get: obj => obj.fightId, set: (obj, value) => { obj.fightId = value; } }, metadata: _metadata }, _fightId_initializers, _fightId_extraInitializers);
            __esDecorate(null, null, _winner_decorators, { kind: "field", name: "winner", static: false, private: false, access: { has: obj => "winner" in obj, get: obj => obj.winner, set: (obj, value) => { obj.winner = value; } }, metadata: _metadata }, _winner_initializers, _winner_extraInitializers);
            __esDecorate(null, null, _victoryMethod_decorators, { kind: "field", name: "victoryMethod", static: false, private: false, access: { has: obj => "victoryMethod" in obj, get: obj => obj.victoryMethod, set: (obj, value) => { obj.victoryMethod = value; } }, metadata: _metadata }, _victoryMethod_initializers, _victoryMethod_extraInitializers);
            __esDecorate(null, null, _round_decorators, { kind: "field", name: "round", static: false, private: false, access: { has: obj => "round" in obj, get: obj => obj.round, set: (obj, value) => { obj.round = value; } }, metadata: _metadata }, _round_initializers, _round_extraInitializers);
            __esDecorate(null, null, _duration_decorators, { kind: "field", name: "duration", static: false, private: false, access: { has: obj => "duration" in obj, get: obj => obj.duration, set: (obj, value) => { obj.duration = value; } }, metadata: _metadata }, _duration_initializers, _duration_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _otpCode_decorators, { kind: "field", name: "otpCode", static: false, private: false, access: { has: obj => "otpCode" in obj, get: obj => obj.otpCode, set: (obj, value) => { obj.otpCode = value; } }, metadata: _metadata }, _otpCode_initializers, _otpCode_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ValidateFightResultDTO = ValidateFightResultDTO;
let ListFightsDTO = (() => {
    var _a;
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _fighterId_decorators;
    let _fighterId_initializers = [];
    let _fighterId_extraInitializers = [];
    let _fromDate_decorators;
    let _fromDate_initializers = [];
    let _fromDate_extraInitializers = [];
    let _toDate_decorators;
    let _toDate_initializers = [];
    let _toDate_extraInitializers = [];
    let _limit_decorators;
    let _limit_initializers = [];
    let _limit_extraInitializers = [];
    let _offset_decorators;
    let _offset_initializers = [];
    let _offset_extraInitializers = [];
    return _a = class ListFightsDTO {
            constructor() {
                this.status = __runInitializers(this, _status_initializers, void 0);
                this.fighterId = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _fighterId_initializers, void 0));
                this.fromDate = (__runInitializers(this, _fighterId_extraInitializers), __runInitializers(this, _fromDate_initializers, void 0));
                this.toDate = (__runInitializers(this, _fromDate_extraInitializers), __runInitializers(this, _toDate_initializers, void 0));
                this.limit = (__runInitializers(this, _toDate_extraInitializers), __runInitializers(this, _limit_initializers, 20));
                this.offset = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _offset_initializers, 0));
                __runInitializers(this, _offset_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _fighterId_decorators = [(0, class_validator_1.IsUUID)(), (0, class_validator_1.IsOptional)()];
            _fromDate_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsOptional)()];
            _toDate_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsOptional)()];
            _limit_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _offset_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.Min)(0)];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _fighterId_decorators, { kind: "field", name: "fighterId", static: false, private: false, access: { has: obj => "fighterId" in obj, get: obj => obj.fighterId, set: (obj, value) => { obj.fighterId = value; } }, metadata: _metadata }, _fighterId_initializers, _fighterId_extraInitializers);
            __esDecorate(null, null, _fromDate_decorators, { kind: "field", name: "fromDate", static: false, private: false, access: { has: obj => "fromDate" in obj, get: obj => obj.fromDate, set: (obj, value) => { obj.fromDate = value; } }, metadata: _metadata }, _fromDate_initializers, _fromDate_extraInitializers);
            __esDecorate(null, null, _toDate_decorators, { kind: "field", name: "toDate", static: false, private: false, access: { has: obj => "toDate" in obj, get: obj => obj.toDate, set: (obj, value) => { obj.toDate = value; } }, metadata: _metadata }, _toDate_initializers, _toDate_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: obj => "limit" in obj, get: obj => obj.limit, set: (obj, value) => { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: obj => "offset" in obj, get: obj => obj.offset, set: (obj, value) => { obj.offset = value; } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ListFightsDTO = ListFightsDTO;
// ========== JOURNÉES DE LUTTE ==========
let FightInDayEventDTO = (() => {
    var _a;
    let _fighterAId_decorators;
    let _fighterAId_initializers = [];
    let _fighterAId_extraInitializers = [];
    let _fighterBId_decorators;
    let _fighterBId_initializers = [];
    let _fighterBId_extraInitializers = [];
    let _order_decorators;
    let _order_initializers = [];
    let _order_extraInitializers = [];
    let _scheduledTime_decorators;
    let _scheduledTime_initializers = [];
    let _scheduledTime_extraInitializers = [];
    return _a = class FightInDayEventDTO {
            constructor() {
                this.fighterAId = __runInitializers(this, _fighterAId_initializers, void 0);
                this.fighterBId = (__runInitializers(this, _fighterAId_extraInitializers), __runInitializers(this, _fighterBId_initializers, void 0));
                this.order = (__runInitializers(this, _fighterBId_extraInitializers), __runInitializers(this, _order_initializers, void 0));
                this.scheduledTime = (__runInitializers(this, _order_extraInitializers), __runInitializers(this, _scheduledTime_initializers, void 0));
                __runInitializers(this, _scheduledTime_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fighterAId_decorators = [(0, class_validator_1.IsUUID)()];
            _fighterBId_decorators = [(0, class_validator_1.IsUUID)()];
            _order_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(6)];
            _scheduledTime_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _fighterAId_decorators, { kind: "field", name: "fighterAId", static: false, private: false, access: { has: obj => "fighterAId" in obj, get: obj => obj.fighterAId, set: (obj, value) => { obj.fighterAId = value; } }, metadata: _metadata }, _fighterAId_initializers, _fighterAId_extraInitializers);
            __esDecorate(null, null, _fighterBId_decorators, { kind: "field", name: "fighterBId", static: false, private: false, access: { has: obj => "fighterBId" in obj, get: obj => obj.fighterBId, set: (obj, value) => { obj.fighterBId = value; } }, metadata: _metadata }, _fighterBId_initializers, _fighterBId_extraInitializers);
            __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: obj => "order" in obj, get: obj => obj.order, set: (obj, value) => { obj.order = value; } }, metadata: _metadata }, _order_initializers, _order_extraInitializers);
            __esDecorate(null, null, _scheduledTime_decorators, { kind: "field", name: "scheduledTime", static: false, private: false, access: { has: obj => "scheduledTime" in obj, get: obj => obj.scheduledTime, set: (obj, value) => { obj.scheduledTime = value; } }, metadata: _metadata }, _scheduledTime_initializers, _scheduledTime_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.FightInDayEventDTO = FightInDayEventDTO;
let CreateDayEventDTO = (() => {
    var _a;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _date_decorators;
    let _date_initializers = [];
    let _date_extraInitializers = [];
    let _location_decorators;
    let _location_initializers = [];
    let _location_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _bannerImage_decorators;
    let _bannerImage_initializers = [];
    let _bannerImage_extraInitializers = [];
    let _isFeatured_decorators;
    let _isFeatured_initializers = [];
    let _isFeatured_extraInitializers = [];
    let _fights_decorators;
    let _fights_initializers = [];
    let _fights_extraInitializers = [];
    return _a = class CreateDayEventDTO {
            constructor() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.date = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _date_initializers, void 0));
                this.location = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                this.description = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.bannerImage = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _bannerImage_initializers, void 0));
                this.isFeatured = (__runInitializers(this, _bannerImage_extraInitializers), __runInitializers(this, _isFeatured_initializers, false));
                this.fights = (__runInitializers(this, _isFeatured_extraInitializers), __runInitializers(this, _fights_initializers, void 0));
                __runInitializers(this, _fights_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)()];
            _date_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date)];
            _location_decorators = [(0, class_validator_1.IsString)()];
            _description_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _bannerImage_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _isFeatured_decorators = [(0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _fights_decorators = [(0, class_validator_1.IsArray)(), (0, class_transformer_1.Type)(() => FightInDayEventDTO)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: obj => "date" in obj, get: obj => obj.date, set: (obj, value) => { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _bannerImage_decorators, { kind: "field", name: "bannerImage", static: false, private: false, access: { has: obj => "bannerImage" in obj, get: obj => obj.bannerImage, set: (obj, value) => { obj.bannerImage = value; } }, metadata: _metadata }, _bannerImage_initializers, _bannerImage_extraInitializers);
            __esDecorate(null, null, _isFeatured_decorators, { kind: "field", name: "isFeatured", static: false, private: false, access: { has: obj => "isFeatured" in obj, get: obj => obj.isFeatured, set: (obj, value) => { obj.isFeatured = value; } }, metadata: _metadata }, _isFeatured_initializers, _isFeatured_extraInitializers);
            __esDecorate(null, null, _fights_decorators, { kind: "field", name: "fights", static: false, private: false, access: { has: obj => "fights" in obj, get: obj => obj.fights, set: (obj, value) => { obj.fights = value; } }, metadata: _metadata }, _fights_initializers, _fights_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateDayEventDTO = CreateDayEventDTO;
let UpdateDayEventDTO = (() => {
    var _a;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _date_decorators;
    let _date_initializers = [];
    let _date_extraInitializers = [];
    let _location_decorators;
    let _location_initializers = [];
    let _location_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _bannerImage_decorators;
    let _bannerImage_initializers = [];
    let _bannerImage_extraInitializers = [];
    let _isFeatured_decorators;
    let _isFeatured_initializers = [];
    let _isFeatured_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    return _a = class UpdateDayEventDTO {
            constructor() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.date = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _date_initializers, void 0));
                this.location = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                this.description = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.bannerImage = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _bannerImage_initializers, void 0));
                this.isFeatured = (__runInitializers(this, _bannerImage_extraInitializers), __runInitializers(this, _isFeatured_initializers, void 0));
                this.status = (__runInitializers(this, _isFeatured_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                __runInitializers(this, _status_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _date_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsOptional)()];
            _location_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _description_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _bannerImage_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _isFeatured_decorators = [(0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _status_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: obj => "date" in obj, get: obj => obj.date, set: (obj, value) => { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _bannerImage_decorators, { kind: "field", name: "bannerImage", static: false, private: false, access: { has: obj => "bannerImage" in obj, get: obj => obj.bannerImage, set: (obj, value) => { obj.bannerImage = value; } }, metadata: _metadata }, _bannerImage_initializers, _bannerImage_extraInitializers);
            __esDecorate(null, null, _isFeatured_decorators, { kind: "field", name: "isFeatured", static: false, private: false, access: { has: obj => "isFeatured" in obj, get: obj => obj.isFeatured, set: (obj, value) => { obj.isFeatured = value; } }, metadata: _metadata }, _isFeatured_initializers, _isFeatured_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateDayEventDTO = UpdateDayEventDTO;
let ListDayEventsDTO = (() => {
    var _a;
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _fromDate_decorators;
    let _fromDate_initializers = [];
    let _fromDate_extraInitializers = [];
    let _toDate_decorators;
    let _toDate_initializers = [];
    let _toDate_extraInitializers = [];
    let _limit_decorators;
    let _limit_initializers = [];
    let _limit_extraInitializers = [];
    let _offset_decorators;
    let _offset_initializers = [];
    let _offset_extraInitializers = [];
    return _a = class ListDayEventsDTO {
            constructor() {
                this.status = __runInitializers(this, _status_initializers, void 0);
                this.fromDate = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _fromDate_initializers, void 0));
                this.toDate = (__runInitializers(this, _fromDate_extraInitializers), __runInitializers(this, _toDate_initializers, void 0));
                this.limit = (__runInitializers(this, _toDate_extraInitializers), __runInitializers(this, _limit_initializers, 20));
                this.offset = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _offset_initializers, 0));
                __runInitializers(this, _offset_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _fromDate_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsOptional)()];
            _toDate_decorators = [(0, class_validator_1.IsDate)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsOptional)()];
            _limit_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _offset_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.Min)(0)];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _fromDate_decorators, { kind: "field", name: "fromDate", static: false, private: false, access: { has: obj => "fromDate" in obj, get: obj => obj.fromDate, set: (obj, value) => { obj.fromDate = value; } }, metadata: _metadata }, _fromDate_initializers, _fromDate_extraInitializers);
            __esDecorate(null, null, _toDate_decorators, { kind: "field", name: "toDate", static: false, private: false, access: { has: obj => "toDate" in obj, get: obj => obj.toDate, set: (obj, value) => { obj.toDate = value; } }, metadata: _metadata }, _toDate_initializers, _toDate_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: obj => "limit" in obj, get: obj => obj.limit, set: (obj, value) => { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: obj => "offset" in obj, get: obj => obj.offset, set: (obj, value) => { obj.offset = value; } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ListDayEventsDTO = ListDayEventsDTO;
