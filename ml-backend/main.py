from fastapi import FastAPI
from pydantic import BaseModel
import subprocess

app = FastAPI()

class CodeRequest(BaseModel):
    code: str

@app.get("/")
def home():
    return {"status": "ML backend is running"}

@app.post("/execute")
def execute_code(request: CodeRequest):
    try:
        result = subprocess.run(
            ["python", "-c", request.code],
            capture_output=True,
            text=True,
            timeout=10
        )
        return {
            "output": result.stdout if result.returncode == 0 else result.stderr,
            "error": result.returncode != 0
        }
    except Exception as e:
        return {"output": str(e), "error": True}
