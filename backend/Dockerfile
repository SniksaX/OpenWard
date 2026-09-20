# Frontend
FROM node:22-bookworm AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=
RUN npm run build

# Build
FROM golang:1.26-bookworm AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./

ENV CGO_ENABLED=1
RUN go build -o /out/openward ./src

# Runtime
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 1000 --home-dir /data --create-home openward

COPY --from=build /out/openward /usr/local/bin/openward
COPY --from=frontend /frontend/dist /app/dist

# SQLite volume is owned by the non-root user. WireGuard (/etc/wireguard, /dev/net/tun,
# NET_ADMIN) typically needs root at runtime — compose does not drop USER.
WORKDIR /data
ENV DB_PATH=/data/database.db
ENV SERVE_DIR=/app/dist

EXPOSE 4444
ENTRYPOINT ["/usr/local/bin/openward"]
