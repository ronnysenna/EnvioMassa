# Multi-stage Dockerfile for Next.js 16 + Prisma
# Builder stage
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Allow overriding NODE_ENV and npm production flag at build time
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
ARG NPM_CONFIG_PRODUCTION=false
ENV NPM_CONFIG_PRODUCTION=${NPM_CONFIG_PRODUCTION}
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time PUBLIC environment variables (only expose NEXT_PUBLIC_* that are safe for the client)
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ARG NEXT_PUBLIC_CONFIRM_THRESHOLD
ENV NEXT_PUBLIC_CONFIRM_THRESHOLD=${NEXT_PUBLIC_CONFIRM_THRESHOLD}

# copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false || npm install

# copy source
COPY prisma ./prisma
COPY scripts ./scripts
COPY . .

# Generate version automatically and generate prisma client
RUN node scripts/generate-version.js && \
    npx prisma generate && \
    npm run build

# Runner stage
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Inherit version from build stage (already embedded in .next)
ARG NEXT_PUBLIC_APP_VERSION=1.0.1-dev
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --production --prefer-offline --no-audit --progress=false || npm install --production

# copy build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Criar diretório de uploads e definir permissões
RUN mkdir -p /app/public/uploads && chmod 755 /app/public/uploads

# Copiar script de entrypoint
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Volume para persistência de uploads entre restarts
VOLUME ["/app/public/uploads"]

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
