export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Império do Açaí API',
    version: '1.0.0',
    description: 'API REST do e-commerce Império do Açaí',
  },
  servers: [{ url: '/api', description: 'API base' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Catalog' },
    { name: 'Orders' },
    { name: 'Admin' },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Healthcheck',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastro',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Criado' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        responses: { '200': { description: 'Tokens' } },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token',
        responses: { '200': { description: 'Novos tokens' } },
      },
    },
    '/api/products': {
      get: {
        tags: ['Catalog'],
        summary: 'Listar produtos',
        responses: { '200': { description: 'Lista paginada' } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Criar pedido',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Pedido criado' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
