FROM python:3.11

RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 appuser

WORKDIR /app

RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --no-dev

COPY . .
EXPOSE 8000

USER appuser
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
