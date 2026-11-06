FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies using npm install (handles package-lock version drift gracefully)
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built application and modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/package-lock.json* ./package-lock.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "start"]
