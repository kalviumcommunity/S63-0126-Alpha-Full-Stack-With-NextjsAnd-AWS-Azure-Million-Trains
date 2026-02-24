import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint for Load Balancers and Container Orchestration
 * 
 * Used by:
 * - AWS ECS/ALB health checks
 * - Azure App Service health monitoring
 * - Docker Compose health checks
 * - Kubernetes liveness/readiness probes
 * 
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service is unhealthy
 */

export async function GET(request: NextRequest) {
  try {
    // Basic health check response
    const healthData: {
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      database?: string;
      redis?: string;
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.APP_VERSION || '1.0.0',
    };

    // Optional: Add database connectivity check
    if (process.env.ENABLE_HEALTH_DB_CHECK === 'true') {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        healthData.database = 'connected';
      } catch (dbError) {
        console.error('Health check - Database error:', dbError);
        healthData.database = 'disconnected';
        
        // Return unhealthy status if DB check is enabled and failing
        return NextResponse.json(
          {
            ...healthData,
            status: 'unhealthy',
            error: 'Database connection failed',
          },
          { status: 503 }
        );
      }
    }

    // Optional: Add Redis connectivity check
    if (process.env.ENABLE_HEALTH_REDIS_CHECK === 'true') {
      try {
        const redisModule = await import('@/lib/redis');
        // Check if getRedisClient exists
        if ('getRedisClient' in redisModule) {
          const redis = (redisModule as any).getRedisClient();
          await redis.ping();
          healthData.redis = 'connected';
        }
      } catch (redisError) {
        console.error('Health check - Redis error:', redisError);
        healthData.redis = 'disconnected';
        // Redis is optional, don't fail health check
      }
    }

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Simple HEAD request support for basic health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
