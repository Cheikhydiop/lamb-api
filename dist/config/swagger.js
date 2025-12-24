"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const package_json_1 = require("../../package.json");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Better API',
            version: package_json_1.version,
            description: 'API documentation for the Better sports betting platform',
            contact: {
                name: 'Better Team',
                email: 'support@better-api.com',
            },
        },
        servers: [
            {
                url: '/',
                description: 'Current Server',
            },
            {
                url: 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app',
                description: 'Production Server (Koyeb)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/dto/*.ts'], // Path to the API docs
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
