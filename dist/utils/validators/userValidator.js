"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const customErrors_1 = require("../../errors/customErrors");
class UserValidator {
    static validateRegister(data) {
        const errors = [];
        // Validation du nom
        if (!data.name || data.name.trim().length === 0) {
            errors.push({
                field: 'name',
                message: this.VALIDATION_RULES.NAME.MESSAGES.REQUIRED,
                value: data.name,
                constraint: 'required'
            });
        }
        else {
            const name = data.name.trim();
            if (name.length < this.VALIDATION_RULES.NAME.MIN_LENGTH) {
                errors.push({
                    field: 'name',
                    message: this.VALIDATION_RULES.NAME.MESSAGES.TOO_SHORT,
                    value: name,
                    constraint: `min_length:${this.VALIDATION_RULES.NAME.MIN_LENGTH}`
                });
            }
            if (name.length > this.VALIDATION_RULES.NAME.MAX_LENGTH) {
                errors.push({
                    field: 'name',
                    message: this.VALIDATION_RULES.NAME.MESSAGES.TOO_LONG,
                    value: name,
                    constraint: `max_length:${this.VALIDATION_RULES.NAME.MAX_LENGTH}`
                });
            }
            if (!this.VALIDATION_RULES.NAME.PATTERN.test(name)) {
                errors.push({
                    field: 'name',
                    message: this.VALIDATION_RULES.NAME.MESSAGES.INVALID_FORMAT,
                    value: name,
                    constraint: 'pattern'
                });
            }
        }
        // Validation de l'email
        if (!data.email || data.email.trim().length === 0) {
            errors.push({
                field: 'email',
                message: this.VALIDATION_RULES.EMAIL.MESSAGES.REQUIRED,
                value: data.email,
                constraint: 'required'
            });
        }
        else {
            const email = data.email.toLowerCase().trim();
            if (email.length > this.VALIDATION_RULES.EMAIL.MAX_LENGTH) {
                errors.push({
                    field: 'email',
                    message: this.VALIDATION_RULES.EMAIL.MESSAGES.TOO_LONG,
                    value: email,
                    constraint: `max_length:${this.VALIDATION_RULES.EMAIL.MAX_LENGTH}`
                });
            }
            if (!this.VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
                errors.push({
                    field: 'email',
                    message: this.VALIDATION_RULES.EMAIL.MESSAGES.INVALID_FORMAT,
                    value: email,
                    constraint: 'email_format'
                });
            }
        }
        // Validation du téléphone
        if (!data.phone || data.phone.trim().length === 0) {
            errors.push({
                field: 'phone',
                message: this.VALIDATION_RULES.PHONE.MESSAGES.REQUIRED,
                value: data.phone,
                constraint: 'required'
            });
        }
        else {
            const phone = data.phone.trim();
            // Valider le format sénégalais: +221 suivi de 9 chiffres
            if (!this.VALIDATION_RULES.PHONE.PATTERN.test(phone)) {
                errors.push({
                    field: 'phone',
                    message: this.VALIDATION_RULES.PHONE.MESSAGES.INVALID_FORMAT,
                    value: phone,
                    constraint: 'phone_format'
                });
            }
        }
        // Validation du mot de passe
        if (!data.password) {
            errors.push({
                field: 'password',
                message: this.VALIDATION_RULES.PASSWORD.MESSAGES.REQUIRED,
                value: undefined,
                constraint: 'required'
            });
        }
        else {
            const password = data.password;
            if (password.length < this.VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
                errors.push({
                    field: 'password',
                    message: this.VALIDATION_RULES.PASSWORD.MESSAGES.TOO_SHORT,
                    value: '[HIDDEN]',
                    constraint: `min_length:${this.VALIDATION_RULES.PASSWORD.MIN_LENGTH}`
                });
            }
            if (password.length > this.VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
                errors.push({
                    field: 'password',
                    message: this.VALIDATION_RULES.PASSWORD.MESSAGES.TOO_LONG,
                    value: '[HIDDEN]',
                    constraint: `max_length:${this.VALIDATION_RULES.PASSWORD.MAX_LENGTH}`
                });
            }
            // Validation des exigences de complexité - RELAXED
            // if (!this.VALIDATION_RULES.PASSWORD.REQUIREMENTS.UPPERCASE.test(password)) { ... }
            // Simpler check only for min length which is already done above.
        }
        if (errors.length > 0) {
            throw new customErrors_1.ValidationError('La validation des données d\'inscription a échoué', errors);
        }
        return {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            phone: data.phone.trim(),
            password: data.password
        };
    }
    static validateLogin(data) {
        const errors = [];
        // Validation de l'email
        if (!data.email || data.email.trim().length === 0) {
            errors.push({
                field: 'email',
                message: this.VALIDATION_RULES.EMAIL.MESSAGES.REQUIRED,
                value: data.email,
                constraint: 'required'
            });
        }
        else {
            const email = data.email.toLowerCase().trim();
            if (!this.VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
                errors.push({
                    field: 'email',
                    message: this.VALIDATION_RULES.EMAIL.MESSAGES.INVALID_FORMAT,
                    value: email,
                    constraint: 'email_format'
                });
            }
        }
        // Validation du mot de passe
        if (!data.password || data.password.trim().length === 0) {
            errors.push({
                field: 'password',
                message: this.VALIDATION_RULES.PASSWORD.MESSAGES.REQUIRED,
                value: '[HIDDEN]',
                constraint: 'required'
            });
        }
        if (errors.length > 0) {
            throw new customErrors_1.ValidationError('La validation des données de connexion a échoué', errors);
        }
        return {
            email: data.email.toLowerCase().trim(),
            password: data.password
        };
    }
    static validateEmailVerification(userId, otpCode) {
        const errors = [];
        if (!userId || userId.trim().length === 0) {
            errors.push({
                field: 'userId',
                message: 'L\'identifiant utilisateur est requis',
                value: userId,
                constraint: 'required'
            });
        }
        else if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
            errors.push({
                field: 'userId',
                message: 'L\'identifiant utilisateur n\'est pas au format UUID valide',
                value: userId,
                constraint: 'uuid_format'
            });
        }
        if (!otpCode || otpCode.trim().length === 0) {
            errors.push({
                field: 'otpCode',
                message: 'Le code OTP est requis',
                value: otpCode,
                constraint: 'required'
            });
        }
        else if (!/^[0-9]{6}$/.test(otpCode)) {
            errors.push({
                field: 'otpCode',
                message: 'Le code OTP doit être composé de 6 chiffres',
                value: otpCode,
                constraint: 'pattern:^[0-9]{6}$'
            });
        }
        if (errors.length > 0) {
            throw new customErrors_1.ValidationError('La validation des données de vérification email a échoué', errors);
        }
    }
}
// Constantes de validation
UserValidator.VALIDATION_RULES = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50,
        PATTERN: /^[a-zA-ZÀ-ÿ\s'-]+$/,
        MESSAGES: {
            REQUIRED: 'Le nom est requis',
            TOO_SHORT: 'Le nom doit contenir au moins 2 caractères',
            TOO_LONG: 'Le nom ne peut pas dépasser 50 caractères',
            INVALID_FORMAT: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
        }
    },
    EMAIL: {
        PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        MAX_LENGTH: 100,
        MESSAGES: {
            REQUIRED: "L'adresse email est requise",
            INVALID_FORMAT: "L'adresse email n'est pas valide",
            TOO_LONG: "L'adresse email ne peut pas dépasser 100 caractères"
        }
    },
    PHONE: {
        PATTERN: /^\+221[0-9]{9}$/,
        MESSAGES: {
            REQUIRED: 'Le numéro de téléphone est requis',
            INVALID_FORMAT: 'Le format du numéro de téléphone est invalide. Format attendu: +221XXXXXXXXX (numéro sénégalais)',
            TOO_SHORT: 'Le numéro de téléphone doit être au format +221XXXXXXXXX'
        }
    },
    PASSWORD: {
        MIN_LENGTH: 4,
        MAX_LENGTH: 100,
        REQUIREMENTS: {
            // Relaxed requirements for better user experience
            UPPERCASE: /.*/,
            LOWERCASE: /.*/,
            NUMBER: /.*/,
            SPECIAL: /.*/
        },
        MESSAGES: {
            REQUIRED: 'Le mot de passe est requis',
            TOO_SHORT: 'Le mot de passe doit contenir au moins 4 caractères',
            TOO_LONG: 'Le mot de passe ne peut pas dépasser 100 caractères',
            NO_UPPERCASE: '',
            NO_LOWERCASE: '',
            NO_NUMBER: '',
            NO_SPECIAL: ''
        }
    }
};
exports.default = UserValidator;
