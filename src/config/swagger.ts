import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Better API',
            version,
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

export const swaggerSpec = swaggerJsdoc(options);
