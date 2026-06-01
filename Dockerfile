FROM node:24.15.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom"
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build:prod

FROM node:24.15.0-alpine AS ssr
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/car-showroom ./dist/car-showroom
EXPOSE 4000
CMD ["node", "dist/car-showroom/server/server.mjs"]
