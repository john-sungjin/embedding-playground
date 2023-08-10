Really odd setup. Couple relevant issues:

https://github.com/python-poetry/poetry/issues/8106

https://github.com/python-poetry/poetry/issues/6409

What ended up working was the current `pyproject.toml`, but instead of running `poetry install`, running `poetry lock` first.

Now that the lockfile is generated, though, it should be totally fine to just `poetry install`.