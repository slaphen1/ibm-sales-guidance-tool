# ── Base stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies stage (production deps only) ─────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Builder stage (all deps including devDependencies) ────────────────────────
FROM base AS builder
COPY package.json package-lock.json* ./
# Install ALL dependencies (including devDeps like typescript, next, etc.)
RUN npm ci
COPY . .
# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
