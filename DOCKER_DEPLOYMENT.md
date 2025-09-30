# Portal Home Hub - Docker Deployment Guide

This guide explains how to run Portal Home Hub using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Your environment variables configured

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your values:

```bash
cp .env.docker .env.local
```

Edit `.env.local` with your actual Supabase credentials and other configuration values.

### 2. Build and Run with Docker

```bash
# Make sure Docker Desktop is running
# Build the Docker image
docker build -t portal-home-hub .

# Run the container
docker run -p 3000:3000 --env-file .env.local portal-home-hub
```

### 3. Using Docker Compose (Recommended)

```bash
# Build and run the production container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# Stop the container
docker-compose down
```

## Development Mode

For development with hot reloading:

```bash
# Run development container with hot reloading
docker-compose --profile dev up portal-home-hub-dev --build

# Or directly with Docker
docker build -f Dockerfile.dev -t portal-home-hub-dev .
docker run -p 3001:3000 -v $(pwd):/app --env-file .env.local portal-home-hub-dev
```

## Container Management

### View running containers
```bash
docker ps
```

### View logs
```bash
# Docker Compose
docker-compose logs -f

# Direct Docker
docker logs -f <container_id>
```

### Stop containers
```bash
# Docker Compose
docker-compose down

# Direct Docker
docker stop <container_id>
```

### Remove containers and images
```bash
# Remove containers
docker-compose down --rmi all

# Remove unused images
docker image prune
```

## Health Check

The application includes a health check endpoint at `/api/health` that Docker uses to verify the container is running properly.

Test it manually:
```bash
curl http://localhost:3000/api/health
```

## Environment Variables

Required environment variables for Docker deployment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Portal API
NEXT_PUBLIC_PORTAL_API_URL=https://portalhomehub.com

# Environment
NODE_ENV=production
```

## Production Deployment

### Docker Hub Deployment

1. Build and tag the image:
```bash
docker build -t yourusername/portal-home-hub:latest .
```

2. Push to Docker Hub:
```bash
docker push yourusername/portal-home-hub:latest
```

3. Deploy on your server:
```bash
docker pull yourusername/portal-home-hub:latest
docker run -d -p 3000:3000 --env-file .env.local --name portal-home-hub yourusername/portal-home-hub:latest
```

### Container Registry Deployment

For cloud providers (AWS ECR, Google Container Registry, etc.):

```bash
# Tag for your registry
docker tag portal-home-hub:latest your-registry/portal-home-hub:latest

# Push to registry
docker push your-registry/portal-home-hub:latest
```

## Troubleshooting

### Container won't start
- Check environment variables in `.env.local`
- Verify Docker Desktop is running
- Check logs with `docker-compose logs`

### Port conflicts
- Change the port mapping: `-p 3001:3000`
- Or update docker-compose.yml ports section

### Build failures
- Clear Docker cache: `docker builder prune`
- Rebuild without cache: `docker build --no-cache -t portal-home-hub .`

### Memory issues
- Increase Docker Desktop memory allocation
- Add memory limits to docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
```

## Optimization

### Multi-stage build
The Dockerfile uses multi-stage builds to minimize image size:
- Dependencies stage: Installs only production dependencies
- Builder stage: Builds the application
- Runner stage: Final lean image with only necessary files

### Image size optimization
- Uses Alpine Linux base image
- Leverages Next.js standalone output
- Excludes development dependencies and build artifacts

## Monitoring

### Container health
```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' <container_id>
```

### Resource usage
```bash
# Monitor container resource usage
docker stats
```

### Logs
```bash
# Follow logs in real-time
docker-compose logs -f portal-home-hub
```

## Security Considerations

- Environment variables are not included in the image
- Container runs as non-root user (nextjs:nodejs)
- Only necessary ports are exposed
- Uses official Node.js base images with security updates

## Support

For issues related to Docker deployment, check:
1. Environment variable configuration
2. Docker Desktop status and logs
3. Network connectivity to Supabase
4. Port availability
5. Container logs for specific errors