from server import app
import pathlib
import json

if __name__ == "__main__":
    openapi = app.openapi()

    pathlib.Path("server_openapi.json").write_text(json.dumps(openapi, indent=2))
