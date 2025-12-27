"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsController = void 0;
const typedi_1 = __importDefault(require("typedi"));
const UserSettingsService_1 = require("../services/UserSettingsService");
class UserSettingsController {
    static getSettings(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id; // Assumes requireAuth middleware
                const service = typedi_1.default.get(UserSettingsService_1.UserSettingsService);
                const settings = yield service.getUserSettings(userId);
                res.status(200).json({
                    success: true,
                    data: settings
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updateProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const service = typedi_1.default.get(UserSettingsService_1.UserSettingsService);
                // Basic validation (could be moved to DTO/middleware)
                const allowedFields = ['name', 'email', 'bio', 'city', 'country', 'dateOfBirth', 'favoriteStable', 'avatar'];
                const data = req.body;
                const filteredData = {};
                Object.keys(data).forEach(key => {
                    if (allowedFields.includes(key)) {
                        filteredData[key] = data[key];
                    }
                });
                const updatedSettings = yield service.updateProfile(userId, filteredData);
                res.status(200).json({
                    success: true,
                    data: updatedSettings,
                    message: 'Profil mis à jour avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updatePreferences(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const service = typedi_1.default.get(UserSettingsService_1.UserSettingsService);
                const allowedFields = ['notificationsEnabled', 'emailNotifications', 'smsNotifications', 'language'];
                const data = req.body;
                const filteredData = {};
                Object.keys(data).forEach(key => {
                    if (allowedFields.includes(key)) {
                        filteredData[key] = data[key];
                    }
                });
                const updatedSettings = yield service.updatePreferences(userId, filteredData);
                res.status(200).json({
                    success: true,
                    data: updatedSettings,
                    message: 'Préférences mises à jour avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.UserSettingsController = UserSettingsController;
