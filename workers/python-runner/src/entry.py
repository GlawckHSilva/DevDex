from workers import Response, WorkerEntrypoint

from runner import RunnerError, run_tests


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        if request.method == "GET":
            return Response.json({"ok": True, "runtime": "python-pyodide-1"})
        if request.method != "POST":
            return Response.json({"ok": False, "message": "Método não permitido."}, status=405)
        if request.headers.get("authorization") != f"Bearer {self.env.RUNNER_SECRET}":
            return Response.json({"ok": False, "message": "Não autorizado."}, status=401)

        try:
            body = await request.json()
            result = await run_tests(body.get("code"), body.get("functionName"), body.get("tests"))
            return Response.json({"ok": True, "results": result})
        except RunnerError as error:
            return Response.json({"ok": False, "message": str(error)}, status=422)
        except Exception:
            return Response.json({"ok": False, "message": "Não foi possível executar o código Python."}, status=422)
