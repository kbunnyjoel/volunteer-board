# Use multi-stage build to compile backend TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copy backend package metadata and install dependencies
COPY server/package*.json ./
RUN npm install

# Copy backend source and build
COPY server/tsconfig*.json ./
COPY server/src ./src
RUN npm run build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
