Really odd setup. Couple relevant issues:

https://github.com/python-poetry/poetry/issues/8106

https://github.com/python-poetry/poetry/issues/6409

What ended up working was the current `pyproject.toml`, but instead of running `poetry install`, running `poetry lock` first.

Now that the lockfile is generated, though, it should be totally fine to just `poetry install`.

Test curl:
```
curl -d '{"model_name": "hkunlp/instructor-large", "instruction": "Represent this sentence:", "text": "Hello world!"}' \
    -H "Content-Type: application/json" \
    -X POST https://village-dev--embedding-playground-generate-embedding-1d0363-dev.modal.run
```