import json, urllib.request, urllib.parse, urllib.error, base64

BASE = "https://quant-hunter-api.austin-cui.workers.dev"
OUT = []

def call(method, path, data=None, token=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    body = json.dumps(data).encode() if data is not None else None
    try:
        with urllib.request.urlopen(req, body, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return -1, repr(e)

def log(name, ret, show=200):
    s, b = ret
    OUT.append(f"{name}: HTTP {s} :: {b[:show]}")

log("health", call("GET", "/api/health"))

s, b = call("POST", "/api/login", {"email": "austin.cui@co-careers.com", "password": "cyr20041210"})
log("login", (s, b), 120)
try:
    tok = json.loads(b)["token"]
except Exception:
    tok = None
    OUT.append("FATAL: no token, aborting")

log("login-bad-pw", call("POST", "/api/login", {"email": "austin.cui@co-careers.com", "password": "wrong"}), 120)

if tok:
    resume_b64 = base64.b64encode(b"%PDF-1.4 fake test resume bytes for e2e").decode()
    log("submit", call("POST", "/api/submit", {
        "type": "register", "name": "E2E Test", "email": "e2e-test@example.com",
        "intro": "end-to-end harness test submission", "client_token": "gha-test-001",
        "resume": {"name": "e2e-resume.pdf", "type": "application/pdf", "data": resume_b64}}), 120)
    log("submit-dup-idem", call("POST", "/api/submit", {
        "type": "register", "name": "E2E Test", "email": "e2e-test@example.com",
        "client_token": "gha-test-001"}), 120)
    log("submit-bad-email", call("POST", "/api/submit", {
        "type": "register", "name": "X", "email": "not-an-email"}), 120)
    log("unread", call("GET", "/api/unread-count", token=tok), 120)

    s, b = call("GET", "/api/submissions", token=tok)
    rows = json.loads(b).get("rows", []) if s == 200 else []
    log("list", (s, f"rowcount={len(rows)}" + (" sample=" + json.dumps(rows[0], ensure_ascii=False)[:300] if rows else "")), 400)

    target = next((r for r in rows if r.get("client_token") == "gha-test-001"), None)
    if target:
        tid = target["id"]
        rpath = target.get("resume_path") or ""
        log("set-read", call("POST", f"/api/submissions/{tid}/read", {"value": 1}, tok), 120)
        log("set-pin", call("POST", f"/api/submissions/{tid}/pin", {"value": 1}, tok), 120)
        s, b = call("GET", "/api/submissions", token=tok)
        row = next((r for r in json.loads(b)["rows"] if r["id"] == tid), {})
        OUT.append(f"verify-flags: read={row.get('read')} pinned={row.get('pinned')} resume_path={row.get('resume_path')}")
        if rpath:
            s, b = call("GET", "/api/resume/" + urllib.parse.quote(rpath), token=tok)
            OUT.append(f"resume-dl: HTTP {s} len={len(b)} content={b[:40]!r}")
            s, b = call("GET", "/api/resume/" + urllib.parse.quote(rpath))
            OUT.append(f"resume-dl-noauth: HTTP {s} (expect 401)")
        log("delete", call("DELETE", f"/api/submissions/{tid}", token=tok), 120)
        if rpath:
            s, b = call("GET", "/api/resume/" + urllib.parse.quote(rpath), token=tok)
            OUT.append(f"resume-after-delete: HTTP {s} (expect 404)")
    else:
        OUT.append("FATAL: test row not found")

    log("unauth-list", call("GET", "/api/submissions"), 120)

with open("result.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(OUT) + "\n")
print("\n".join(OUT))
