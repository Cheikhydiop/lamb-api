"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactEmailDto = void 0;
const class_validator_1 = require("class-validator");
class ContactEmailDto {
}
exports.ContactEmailDto = ContactEmailDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Name is required' }),
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Name cannot exceed 100 characters' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Subject is required' }),
    (0, class_validator_1.IsString)({ message: 'Subject must be a string' }),
    (0, class_validator_1.MaxLength)(200, { message: 'Subject cannot exceed 200 characters' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Message is required' }),
    (0, class_validator_1.IsString)({ message: 'Message must be a string' }),
    (0, class_validator_1.MinLength)(10, { message: 'Message must be at least 10 characters long' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'Message cannot exceed 2000 characters' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Company must be a string' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Company name cannot exceed 100 characters' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Phone must be a string' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Phone number cannot exceed 20 characters' }),
    __metadata("design:type", String)
], ContactEmailDto.prototype, "phone", void 0);
