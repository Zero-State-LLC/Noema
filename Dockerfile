FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY fixtures ./fixtures
COPY spec-compat.json ./

RUN pip install --no-cache-dir -e .

RUN mkdir -p /app/data
EXPOSE 8080
CMD ["noema-serve", "--host", "0.0.0.0", "--port", "8080", "--db", "/app/data/noema.sqlite3", "--seed", "/app/fixtures/v01-seed/world-seed.json"]
