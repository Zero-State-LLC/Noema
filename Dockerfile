FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY fixtures ./fixtures
COPY examples ./examples
COPY spec-compat.json ./

RUN pip install --no-cache-dir -e ".[postgres]"

RUN mkdir -p /app/data /app/var/objects /app/var/replays
EXPOSE 8080

# Local compose binds 0.0.0.0; --allow-insecure-dev-bind is the C14 golden path
# (NOEMA_ENV=local). Production binds must set TOKEN_SIGNING_SECRET instead.
ENV NOEMA_DB=postgresql://noema:noema@postgres:5432/noema
ENV NOEMA_ENV=local
CMD ["sh", "-c", "noema-serve --host 0.0.0.0 --port 8080 --db \"$NOEMA_DB\" --seed /app/fixtures/v01-seed/world-seed.json --config /app/examples/deployment/local-deployment-config.json --allow-insecure-dev-bind"]
