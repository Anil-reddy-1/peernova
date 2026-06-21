import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Peer Tutoring Marketplace API',
      version: '1.0.0',
      description: 'REST API for the Peer Tutoring Marketplace platform',
      contact: {
        name: 'API Support',
        email: 'support@peertutoring.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID Token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', nullable: true },
            error: {
              type: 'object',
              nullable: true,
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object', nullable: true },
              },
            },
            meta: {
              type: 'object',
              nullable: true,
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
        Error401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'object', nullable: true, example: null },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'UNAUTHORIZED' },
                message: { type: 'string', example: 'Authentication required' },
                details: { type: 'object', nullable: true, example: null },
              },
            },
          },
        },
        Error403: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'FORBIDDEN' },
                message: { type: 'string', example: 'Insufficient permissions' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/v1/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
