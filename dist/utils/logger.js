"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logDir = path.join(process.cwd());
class Logger {
    ensureLogFiles() {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }
    formatMeta(meta) {
        if (!meta)
            return '';
        try {
            return ` ${JSON.stringify(meta)}`;
        }
        catch (_a) {
            return '';
        }
    }
    info(message, meta) {
        this.ensureLogFiles();
        const formattedMessage = this.formatMessage('INFO', message) + this.formatMeta(meta);
        console.log(formattedMessage);
        fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
    }
    error(message, error, meta) {
        this.ensureLogFiles();
        const formattedMessage = this.formatMessage('ERROR', message) + this.formatMeta(meta);
        console.error(formattedMessage);
        fs.appendFileSync(path.join(logDir, 'error.log'), formattedMessage + '\n');
        if (error) {
            fs.appendFileSync(path.join(logDir, 'error.log'), JSON.stringify(error, null, 2) + '\n');
        }
    }
    warn(message, meta) {
        this.ensureLogFiles();
        const formattedMessage = this.formatMessage('WARN', message) + this.formatMeta(meta);
        console.warn(formattedMessage);
        fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
    }
    debug(message, meta) {
        if (process.env.DEBUG === 'true') {
            const formattedMessage = this.formatMessage('DEBUG', message) + this.formatMeta(meta);
            console.debug(formattedMessage);
            fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
        }
    }
}
exports.default = new Logger();
