import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  // Allow requests from Figma plugins (origin: null) and web origins
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Figma plugins, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow specific origins
      const allowedOrigins = [
        configService.get('FRONTEND_URL'),
        'https://www.figma.com',
        'https://figma.com',
        /\.figma\.com$/, // All Figma subdomains
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // For development, allow all origins
        // In production, you should restrict this
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
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
