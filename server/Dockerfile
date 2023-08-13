# Mostly from https://gist.github.com/usr-ein/c42d98abca3cb4632ab0c2c6aff8c88a

FROM python:3.11 as builder

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    # https://python-poetry.org/docs/configuration/#using-environment-variables
    POETRY_VERSION=1.5.1 

ENV POETRY_HOME="/opt/poetry"
RUN --mount=type=cache,target=/root/.cache \
    curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$POETRY_HOME/bin:$PATH"

WORKDIR /app

COPY pyproject.toml poetry.lock ./

# Make poetry create the virtual environment in the project's root
# it gets named `.venv`
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
RUN --mount=type=cache,target=/root/.cache \
    poetry install --without=dev


FROM python:3.11-slim as production

WORKDIR /app
COPY --from=builder /app .
COPY . .

# # Setup poetry.
# RUN curl -sSL https://install.python-poetry.org | python3 -
# ENV POETRY_VIRTUALENVS_CREATE=false
# ENV PATH="${PATH}:/root/.local/bin"

# # Add the app + install dependencies.
# WORKDIR /app
# RUN poetry install --no-root --no-dev
# COPY . .

# Create appuser with a home directory.
RUN useradd -m appuser
USER appuser

EXPOSE 8000
CMD [".venv/bin/uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
