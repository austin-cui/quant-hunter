# -*- coding: utf-8 -*-
"""中基协公示平台客户端：机构搜索 + 员工名单分页拉取。

链路（均已实测验证 2026-09-29）：
  1. GET  personOrgList.html          -> 拿会话 cookie
  2. POST api/pof/personOrg           -> 按机构名模糊搜索，取 userId
  3. POST api/pof/person              -> 按 userId 分页拉员工名单
"""
import json
import random
import time

import requests

from config import (API_ORG, API_PERSON, BASE, MAX_RETRY, ORG_LIST_PAGE,
                    ORG_TYPE_PRIVATE, PERSON_PAGE, REQUEST_DELAY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
}


class AmacClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _warmup(self):
        """访问列表页获取会话 cookie（接口校验 Referer/cookie）。"""
        self.session.get(ORG_LIST_PAGE, timeout=30)
        self.session.headers["Referer"] = ORG_LIST_PAGE

    def _post(self, url, payload, referer, page=0, size=20, retry=0):
        try:
            r = self.session.post(
                url,
                params={"rand": random.random(), "page": page, "size": size},
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers={**self.session.headers, "Content-Type": "application/json",
                         "Referer": referer},
                timeout=30,
            )
            if r.text.startswith("Server Error"):
                raise RuntimeError("server error")
            return r.json()
        except Exception:
            if retry >= MAX_RETRY:
                raise
            time.sleep(2 * (retry + 1))
            self._warmup()
            return self._post(url, payload, referer, page, size, retry + 1)

    def search_orgs(self, keyword):
        """按机构名模糊搜索，返回候选机构列表。"""
        resp = self._post(API_ORG, {"page": 1, "orgType": ORG_TYPE_PRIVATE,
                                    "orgName": keyword}, ORG_LIST_PAGE)
        time.sleep(REQUEST_DELAY)
        return resp.get("content", [])

    def list_persons(self, org_user_id, page_size=20):
        """按机构 userId 拉全部员工名单（自动分页，兼容服务器偶发空页）。"""
        persons, page = [], 0
        total_pages, total_elems = None, None
        while True:
            resp = self._post(
                API_PERSON,
                {"userName": None, "certCode": None, "certName": "certType01",
                 "userId": str(org_user_id), "page": 1},  # 请求体 page 恒为 1，翻页只靠 URL 参数
                PERSON_PAGE, page=page, size=page_size,
            )
            content = resp.get("content", [])
            if resp.get("totalElements"):
                total_elems = resp["totalElements"]
                total_pages = resp.get("totalPages")
            if content:
                persons.extend(content)
            # 已知总页数但本页空 -> 服务器抽风，重试本页
            if not content and total_pages and page < total_pages and len(persons) < (total_elems or 0):
                time.sleep(2)
                continue
            if (total_pages and page >= total_pages - 1) or \
               (total_elems and len(persons) >= total_elems) or \
               (resp.get("last", True) and content):
                break
            if not content and not total_pages:
                break
            page += 1
            time.sleep(REQUEST_DELAY)
        time.sleep(REQUEST_DELAY)
        return persons
