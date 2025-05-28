FROM node:22.12-slim AS builder

WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar el cache de Docker
COPY package.json pnpm-lock.yaml ./

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Instalamos las dependencias (dev y prod)
RUN pnpm install

# Copiamos el resto del código fuente (src, tsconfig.json, etc)
COPY . .

# Compilamos el proyecto TypeScript a JavaScript
RUN pnpm run build


FROM node:22.12-slim AS release

ENV NODE_ENV=production
WORKDIR /app

# Copiamos solo la carpeta dist compilada y los archivos necesarios para producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Instalamos pnpm para producción
RUN npm install -g pnpm

# Instalamos solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

ENTRYPOINT ["node", "dist/index.js"]