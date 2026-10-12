# -*- coding: utf-8 -*-
"""云端每日更新：GitHub Actions 上抓取 -> diff -> 直推 gh-pages 的 flow/data/db.json。

与本地管线（monitor.py + export_data.py）同一套口径：
  - 基线 = gh-pages 线上 db.json（等价于本地 SQLite 最新快照 + 导出）
  - 人员身份 = (org_user_id, cert_code)，diff 规则复刻 db.diff_with_previous
    （新纳入机构按基线处理；证书号出现过的"熟人"跨机构流动仍计入变动）
  - 离职档案 alumni 从基线 people 里取注销前记录（云端无 sqlite 历史快照，
    基线 people 即上一期在册名册，正是"注销前最后一份记录"）
  - history_trend 用合并后 people 的证书历史按 export_data.py 同款算法重算
  - 抓取失败的主体沿用基线名册，避免误报离职

环境变量: GH_TOKEN（或 GITHUB_TOKEN），需 Contents 读写权限。
用法: python cloud_update.py [--dry-run]   # dry-run 只生成不推送（本地验证用）
"""
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

OWNER, REPO = "austin-cui", "quant-hunter"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
DB_REMOTE = "flow/data/db.json"
RAW_DB = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/gh-pages/{DB_REMOTE}"
PAGES_DB = f"https://austin-cui.github.io/quant-hunter/flow/data/db.json"

BJ = timezone(timedelta(hours=8))  # 北京时间


def log(*a):
    print(*a, flush=True)


# ---------- GitHub ----------

def gh_api(method, path, body=None, token=None, retries=5):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries):
        req = urllib.request.Request(
            API + path, data=data, method=method,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "User-Agent": "quant-flow-cloud",
            })
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read().decode()
                if not raw:
                    raise RuntimeError("empty body (200)")
                return json.loads(raw) if raw else {}
        except Exception as e:
            # 空响应/限流/冲突：指数退避后重试
            if attempt < retries - 1:
                wait = 8 * (attempt + 1)
                log(f"  GitHub API {method} 异常({e}), wait {wait}s")
                time.sleep(wait)
                continue
            if isinstance(e, urllib.error.HTTPError):
                raise
            raise RuntimeError(f"{method} {path} failed: {e}")


def blob_sha(raw: bytes) -> str:
    return hashlib.sha1(b"blob %d\x00" % len(raw) + raw).hexdigest()


def get_token():
    for k in ("GH_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(k):
            return os.environ[k]
    local = os.path.join(HERE, "..", ".gh-token")
    if os.path.exists(local):
        return open(local, encoding="utf-8").read().strip()
    raise RuntimeError("缺少 GH_TOKEN / GITHUB_TOKEN")


def load_baseline(token, attempts=4):
    """获取线上 db.json 作为本期 diff 基线。

    主走 Contents API + raw media type（实时无 CDN 缓存，且不受 content 字段大小限制），
    带重试；raw / Pages URL 仅作兜底（二者有 CDN 缓存，刚推送完立刻读可能拿到旧版）。
    """
    url = API + "/contents/" + urllib.parse.quote(DB_REMOTE) + "?ref=gh-pages"
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.raw",
                "User-Agent": "quant-flow-cloud"})
            with urllib.request.urlopen(req, timeout=90) as r:
                raw = r.read().decode()
            if not raw.strip():
                raise RuntimeError("empty body")
            return json.loads(raw)
        except Exception as e:
            last = e
            log(f"Contents API 基线获取失败(第{i+1}次): {e}")
            time.sleep(5 * (i + 1))
    for url in (RAW_DB, PAGES_DB):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "quant-flow-cloud"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            last = e
            log(f"基线下载失败({url}): {e}")
    raise RuntimeError(f"无法获取基线 db.json: {last}")


def push_db(db: dict, token: str):
    raw = json.dumps(db, ensure_ascii=False).encode()
    tree = gh_api("GET", "/git/trees/gh-pages?recursive=1", token=token)
    remote = {urllib.parse.unquote(t["path"]): t["sha"]
              for t in tree["tree"] if t["type"] == "blob"}
    if remote.get(DB_REMOTE) == blob_sha(raw):
        log("数据与线上一致，无需推送")
        return False
    body = {"branch": "gh-pages",
            "message": time.strftime("flow data %Y-%m-%d %H:%M (cloud)", datetime.now(BJ).timetuple()),
            "content": base64.b64encode(raw).decode()}
    if remote.get(DB_REMOTE):
        body["sha"] = remote[DB_REMOTE]
    gh_api("PUT", "/contents/" + urllib.parse.quote(DB_REMOTE), body, token=token)
    log(f"已推送 db.json ({len(raw)//1024} KB) -> gh-pages")
    return True


# ---------- 抓取 ----------

def fetch_all(orgs):
    """多线程抓全部主体，失败主体返回 None（调用方沿用基线名册）。"""
    from amac_client import AmacClient

    results, fails = {}, []
    done = 0

    def job(org):
        c = AmacClient()
        c._warmup()
        return org["user_id"], c.list_persons(org["user_id"])

    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(job, o): o for o in orgs}
        for fut in as_completed(futs):
            org = futs[fut]
            done += 1
            try:
                uid, persons = fut.result()
                results[uid] = persons
                log(f"[{done}/{len(orgs)}] {org['keyword']} -> {org['org_name']}: {len(persons)}人")
            except Exception as e:
                fails.append((org["keyword"], str(e)))
                log(f"[{done}/{len(orgs)}] {org['keyword']} 抓取失败: {e}")
    return results, fails


# ---------- 字段解析（复刻 db.py / export_data.py 口径） ----------

def ms_to_date(ms):
    if not ms:
        return None
    try:
        # 固定按北京时间换算，避免 Actions 运行商（UTC）时区把日期算差一天
        return datetime.fromtimestamp(int(ms) / 1000, tz=BJ).strftime("%Y-%m-%d")
    except (OverflowError, OSError, ValueError):
        return None


def parse_person(org_user_id, raw):
    """API 原始记录 -> people 条目（字段同 export_data 导出的 employees）。"""
    return {
        "org_user_id": org_user_id,
        "cert_code": raw.get("certCode"),
        "user_name": raw.get("userName"),
        "sex": raw.get("sex"),
        "cert_name": raw.get("certName"),
        "education_name": raw.get("educationName"),
        "cert_obtain_date": ms_to_date(raw.get("certObtainDate")),
        "cert_end_date": ms_to_date(raw.get("certEndDate")),
        "status_name": raw.get("statusName"),
        "credit_record_num": raw.get("creditRecordNum"),
        "_raw": raw,
    }


def parse_history(raw):
    try:
        recs = (raw or {}).get("personCertHistoryList") or []
    except Exception:
        return []
    out = []
    for r in recs:
        out.append({
            "org_name": r.get("orgName"),
            "cert_code": r.get("certCode"),
            "cert_obtain_date": ms_to_date(r.get("certObtainDate")),
            "creation_date": ms_to_date(r.get("creationDate")),
            "cert_end_date": ms_to_date(r.get("certEndDate")),
            "status_name": r.get("statusName"),
        })
    out.sort(key=lambda x: x["creation_date"] or x["cert_obtain_date"] or "")
    return out


def trace(uid):
    return ("https://gs.amac.org.cn/amac-infodisc/res/pof/person/"
            f"operPersonList.html?userId={uid}")


# ---------- 主流程 ----------

def main():
    today = datetime.now(BJ).strftime("%Y-%m-%d")
    log(f"=== 云端更新 {today} ===")
    token = get_token()
    base = load_baseline(token)
    base_people = base.get("people", [])
    base_orgs = {o["user_id"]: o for o in base.get("orgs", [])}
    base_snaps = base.get("snapshots", [])
    log(f"基线: {base.get('generated_at')} / {len(base_orgs)} 主体 / {len(base_people)} 人")

    # 机构名单 = resolutions.json（与本地 config.WATCHLIST 同步推送）
    res_path = os.path.join(HERE, "data", "resolutions.json")
    resolutions = json.load(open(res_path, encoding="utf-8"))
    from config import THEME_MAP, WATCHLIST
    tier_map = dict(WATCHLIST)  # 与 monitor.resolve_orgs 同一口径（含 _LEGACY 分档）
    orgs, seen = [], set()
    for keyword, entities in resolutions.items():
        for e in entities:
            uid = str(e["user_id"])
            if uid in seen:
                continue
            seen.add(uid)
            orgs.append({
                "user_id": uid, "org_name": e["org_name"], "keyword": keyword,
                "title": keyword, "aum_tier": tier_map.get(keyword, "百亿名单"),
                "theme": THEME_MAP.get(keyword, ""),
            })
    log(f"监控名单: {len(resolutions)} 品牌 / {len(orgs)} 主体")

    results, fails = fetch_all(orgs)

    # 本期名册：抓不到的主体沿用基线（防止整主体误报离职）
    roster, today_count = [], {}
    for o in orgs:
        uid = o["user_id"]
        raws = results.get(uid)
        today_count[uid] = len(raws) if raws is not None else None
        if raws is None:
            roster.extend([p for p in base_people if p["org_user_id"] == uid])
        else:
            roster.extend(parse_person(uid, r) for r in raws)
    log(f"本期名册: {len(roster)} 人（抓取失败沿用基线: {len(fails)} 家）")

    # ---- diff（复刻 db.diff_with_previous） ----
    old = {(p["org_user_id"], p["cert_code"]): p for p in base_people}
    cur = {(p["org_user_id"], p["cert_code"]): p for p in roster}
    prev_orgs = {k[0] for k in old}
    cur_orgs = {k[0] for k in cur}
    old_certs = {p["cert_code"] for p in base_people}
    cur_certs = {p["cert_code"] for p in roster}

    title_of = {o["user_id"]: o["title"] for o in orgs}
    tier_of = {o["user_id"]: o["aum_tier"] for o in orgs}

    new_changes = []
    for key, row in cur.items():
        if key not in old and (row["org_user_id"] in prev_orgs
                               or row["cert_code"] in old_certs):
            new_changes.append({"snap_date": today, "org_user_id": row["org_user_id"],
                                "org_name": None, "change_type": "join",
                                "cert_code": row["cert_code"],
                                "user_name": row["user_name"]})
    for key, row in old.items():
        if key not in cur and (row["org_user_id"] in cur_orgs
                               or row["cert_code"] in cur_certs):
            new_changes.append({"snap_date": today, "org_user_id": row["org_user_id"],
                                "org_name": None, "change_type": "leave",
                                "cert_code": row["cert_code"],
                                "user_name": row["user_name"]})
    for c in new_changes:
        c["org_name"] = base_orgs.get(c["org_user_id"], {}).get("org_name", "")
        c["title"] = title_of.get(c["org_user_id"], c["org_name"])
        c["tier"] = tier_of.get(c["org_user_id"], "")
        c["trace_url"] = trace(c["org_user_id"])
        c["obtain_date"] = cur.get((c["org_user_id"], c["cert_code"]),
                                   old.get((c["org_user_id"], c["cert_code"]), {})) \
            .get("cert_obtain_date")
    joins = sum(1 for c in new_changes if c["change_type"] == "join")
    leaves = sum(1 for c in new_changes if c["change_type"] == "leave")
    log(f"变动: 入职 {joins} / 离职 {leaves}")

    # ---- 离职档案 alumni（从基线 people 取注销前记录） ----
    alumni_new = []
    for c in new_changes:
        if c["change_type"] != "leave":
            continue
        cand = [p for p in base_people
                if p["cert_code"] == c["cert_code"]
                and p["org_user_id"] == c["org_user_id"]]
        if not cand:
            continue
        r = cand[0]
        # 基线 people 已带解析好的 history（云端拿不到原始 _raw）
        hist = r.get("history") or parse_history(r.get("_raw") or {})
        start = None
        for h in hist:
            if h["org_name"] == c["org_name"]:
                d = h["creation_date"] or h["cert_obtain_date"]
                if d and (start is None or d < start):
                    start = d
        person = {
            "cert_code": r["cert_code"], "user_name": r["user_name"],
            "sex": r.get("sex"), "education_name": r.get("education_name"),
            "cert_obtain_date": r.get("cert_obtain_date"),
            "cert_end_date": r.get("cert_end_date"),
            "status_name": r.get("status_name"),
            "credit_record_num": r.get("credit_record_num"),
            "org_user_id": r["org_user_id"],
            "title": c["title"], "tier": c["tier"], "trace_url": c["trace_url"],
            "history": hist, "departed": True,
            "departed_at": today, "departed_org": c["org_name"],
            "org_tenure_from": start,
        }
        alumni_new.append(person)
        c["profile"] = {k: person[k] for k in
                        ("sex", "education_name", "cert_obtain_date",
                         "org_tenure_from", "departed_at")}

    # ---- people：本期名册 + history + title/tier/trace + 关注链接 ----
    social_by_cert = {w["cert"]: {"maimai": w.get("maimai"), "linkedin": w.get("linkedin")}
                      for w in base.get("watchlist", [])
                      if w.get("cert") and (w.get("maimai") or w.get("linkedin"))}
    people = []
    for p in roster:
        p = dict(p)
        raw = p.pop("_raw", None) or {}
        if raw:
            p["history"] = parse_history(raw)
        else:
            p.setdefault("history", [])  # 基线沿用条目已带 history
        acc = str(raw.get("accountId") or "")
        p["title"] = title_of.get(p["org_user_id"], "")
        p["tier"] = tier_of.get(p["org_user_id"], "")
        p["trace_url"] = trace(p["org_user_id"])
        soc = social_by_cert.get(p["cert_code"])
        if soc:
            p["social"] = soc
        people.append(p)

    # ---- orgs / snapshots / trend ----
    orgs_out = []
    for o in orgs:
        b = base_orgs.get(o["user_id"], {})
        orgs_out.append({
            "user_id": o["user_id"], "org_name": o["org_name"],
            "keyword": o["keyword"], "title": o["title"],
            "aum_tier": o["aum_tier"], "theme": o["theme"],
            "worker_total": b.get("worker_total"),
            "oper_num": b.get("oper_num"),
            "first_seen": b.get("first_seen") or today,
            "last_seen": today,
        })

    snaps = [dict(s) for s in base_snaps]
    base_trend = base.get("trend", {})
    trend = {k: list(v) for k, v in base_trend.items()}
    replace = snaps and snaps[-1].get("snap_date") == today  # 同日重跑：覆盖当日点
    if replace:
        snaps = snaps[:-1]
        for k in trend:
            if trend[k]:
                trend[k] = trend[k][:-1]
    n_prev = len(snaps)
    next_id = max([s.get("snap_id", 0) for s in snaps] or [0]) + 1
    emp_total = sum(today_count[u] if today_count[u] is not None
                    else sum(1 for p in people if p["org_user_id"] == u)
                    for u in [o["user_id"] for o in orgs_out])
    snaps.append({"snap_id": next_id, "snap_date": today, "kind": "daily",
                  "org_count": len(orgs_out), "emp_count": emp_total})
    for o in orgs_out:
        uid = o["user_id"]
        counts = trend.get(uid) or []
        if len(counts) < n_prev:
            counts = [0] * (n_prev - len(counts)) + counts
        counts.append(today_count[uid] if today_count[uid] is not None
                      else sum(1 for p in people if p["org_user_id"] == uid))
        trend[uid] = counts

    # ---- history_trend：合并后 people 按 export_data.py 同款算法重算 ----
    entity_title = {o["org_name"]: o["title"] for o in orgs_out}
    series = defaultdict(lambda: defaultdict(int))
    gen_month = today[:7]
    for p in people:
        by_org = {}
        for h in p["history"]:
            if h["org_name"] in entity_title:
                by_org.setdefault(h["org_name"], []).append(h)
        for org_name, items in by_org.items():
            items.sort(key=lambda x: x["creation_date"] or "")
            cur_from, stints = None, []
            for h in items:
                d = h["creation_date"] or h["cert_obtain_date"]
                if not d:
                    continue
                if h["status_name"] == "注销":
                    if cur_from:
                        stints.append((cur_from, d))
                        cur_from = None
                else:
                    if cur_from:
                        stints.append((cur_from, None))
                    cur_from = d
            if cur_from:
                stints.append((cur_from, None))
            title = entity_title[org_name]
            for frm, to in stints:
                end = (to or gen_month)[:7]
                y, m = int(frm[:4]), int(frm[5:7])
                ey, em = int(end[:4]), int(end[5:7])
                while (y, m) <= (ey, em):
                    series[title][f"{y:04d}-{m:02d}"] += 1
                    m += 1
                    if m > 12:
                        y, m = y + 1, 1
    history_trend = {t: [[mo, series[t][mo]] for mo in sorted(series[t])]
                     for t in series}

    db = {
        "generated_at": today,
        "snapshots": snaps,
        "orgs": orgs_out,
        "people": people,
        "alumni": base.get("alumni", []) + alumni_new,
        "changes": new_changes + base.get("changes", []),
        "trend": trend,
        "history_trend": history_trend,
        "watchlist": base.get("watchlist", []),
    }
    log(f"生成 db.json: {today} / {len(orgs_out)} 主体 / {len(people)} 人 / "
        f"累计变动 {len(db['changes'])} 条")
    if "--dry-run" in sys.argv:
        out = os.path.join(HERE, "..", "tmp-cloud-db.json")
        json.dump(db, open(out, "w", encoding="utf-8"), ensure_ascii=False)
        log(f"DRY-RUN: 未推送，已写出 {os.path.abspath(out)}")
    elif push_db(db, token):
        log("DONE: 已推送，Pages 约 2-4 分钟后刷新")
    else:
        log("DONE: 数据无变化")
    if fails:
        log(f"警告: {len(fails)} 家抓取失败（已沿用基线）: " +
            "; ".join(f"{k}({e})" for k, e in fails[:10]))


if __name__ == "__main__":
    main()
