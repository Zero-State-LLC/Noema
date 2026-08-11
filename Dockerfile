FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY fixtures ./fixtures
COPY spec-compat.json ./

RUN pip install --no-cache-dir -e ".[postgres]"

RUN mkdir -p /app/data /app/var/objects
EXPOSE 8080

# Default: PostgreSQL DSN from compose. Override with --db for SQLite file.
ENV NOEMA_DB=postgresql://noema:noema@postgres:5432/noema
CMD ["sh", "-c", "noema-serve --host 0.0.0.0 --port 8080 --db \"$NOEMA_DB\" --seed /app/fixtures/v01-seed/world-seed.json"]
