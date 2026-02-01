import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { getConnection } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });
  const configService = app.get(ConfigService);

  // Fix batchId column type on startup (one-time migration)
  try {
    const connection = getConnection();
    const result = await connection.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mascots' 
        AND column_name = 'batchId'
    `);
    
    if (result.length > 0 && result[0].data_type === 'uuid') {
      console.log('[Startup] Fixing batchId column type from uuid to text...');
      await connection.query(`
        ALTER TABLE mascots 
        ALTER COLUMN "batchId" TYPE text USING "batchId"::text
      `);
      console.log('[Startup] ✅ batchId column fixed successfully');
    } else if (result.length > 0) {
      console.log(`[Startup] batchId column type is already: ${result[0].data_type}`);
    }
  } catch (error) {
    console.warn('[Startup] Could not fix batchId column (may already be fixed):', error.message);
  }

  // Global exception filter for better error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  // Allow requests from Figma plugins (origin: null) and web origins.
  // Preflight (OPTIONS) must receive Access-Control-Allow-Origin and other CORS headers.
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin OR origin === 'null' (Figma plugin iframe/sandbox)
      if (origin === undefined || origin === null || origin === 'null' || origin === '') {
        return callback(null, true);
      }
      // Allow specific origins
      const allowedOrigins = [
        configService.get('FRONTEND_URL'),
        'https://www.figma.com',
        'https://figma.com',
        /\.figma\.com$/, // All Figma subdomains
        'https://railway.app',
        'https://railway.com',
        /\.railway\.app$/, // All Railway subdomains
        /\.railway\.com$/, // All Railway.com subdomains
      ];
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      if (isAllowed) {
        return callback(null, true);
      }
      const allowAllOrigins =
        process.env.ALLOW_ALL_ORIGINS === 'true' ||
        process.env.NODE_ENV === 'development' ||
        !process.env.NODE_ENV;
      if (allowAllOrigins) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mascot API')
    .setDescription('API for AI mascot generation SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('mascots', 'Mascot generation endpoints')
    .addTag('animations', 'Animation generation endpoints')
    .addTag('logos', 'Logo pack generation endpoints')
    .addTag('poses', 'Pose generation endpoints')
    .addTag('credits', 'Credit management endpoints')
    .addTag('billing', 'Billing and subscription endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Mascot API is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
