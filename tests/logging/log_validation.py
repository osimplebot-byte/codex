#!/usr/bin/env python3
"""Ferramenta de validação de roteamento/retênção de logs."""

from __future__ import annotations

import argparse
import asyncio
import os
from collections import Counter
from datetime import datetime, timezone
from typing import List, Tuple

import boto3
import httpx

AWS_BUCKET = os.getenv("CENTRAL_LOG_BUCKET", "central-audit-logs")
SUPABASE_ENDPOINT = os.getenv("SUPABASE_TEST_ENDPOINT", "https://supabase.internal/rest/v1/health")
N8N_WEBHOOK = os.getenv("N8N_TEST_WEBHOOK", "https://n8n.internal/webhook/test")
EVOLUTION_ENDPOINT = os.getenv("EVOLUTION_TEST_ENDPOINT", "https://evolution-api.internal/api/messages")
S3_PREFIXES = [
    "supabase/audit/",
    "integrations/n8n/",
    "services/evolution/",
]


async def _fire_request(client: httpx.AsyncClient, method: str, url: str, **kwargs) -> Tuple[int, float]:
    resp = await client.request(method, url, **kwargs)
    return resp.status_code, resp.elapsed.total_seconds()


async def run_load(endpoint: str, method: str, payloads: List[dict], concurrency: int = 5) -> Counter:
    counter: Counter = Counter()
    sem = asyncio.Semaphore(concurrency)

    async with httpx.AsyncClient(timeout=10.0) as client:
        async def worker(body: dict) -> None:
            async with sem:
                status, latency = await _fire_request(client, method, endpoint, json=body)
                bucket = f"{status // 100}xx"
                counter[bucket] += 1
                counter[f"latency_sum"] += latency

        await asyncio.gather(*(worker(payload) for payload in payloads))
    return counter


def verify_s3_retention(bucket: str, prefixes: List[str]) -> None:
    s3 = boto3.client("s3")
    today = datetime.now(timezone.utc)
    expected_prefixes = [f"{prefix}{today:%Y/%m/%d}/" for prefix in prefixes]

    for prefix in expected_prefixes:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=1)
        if response.get("KeyCount", 0) == 0:
            raise RuntimeError(f"Nenhum log encontrado para prefixo {prefix}")


def simulate_failures(endpoint: str) -> None:
    with httpx.Client(timeout=5.0) as client:
        resp = client.post(endpoint, json={"simulate_failure": True})
        if resp.status_code < 400:
            raise RuntimeError("Falha planejada não foi disparada corretamente")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=20, help="quantidade de requisições por serviço")
    parser.add_argument("--concurrency", type=int, default=5)
    args = parser.parse_args()

    payloads = [{"ping": i} for i in range(args.samples)]
    stats = {}

    stats["supabase"] = asyncio.run(run_load(SUPABASE_ENDPOINT, "GET", payloads, concurrency=args.concurrency))
    stats["n8n"] = asyncio.run(run_load(N8N_WEBHOOK, "POST", payloads, concurrency=args.concurrency))
    stats["evolution"] = asyncio.run(run_load(EVOLUTION_ENDPOINT, "POST", payloads, concurrency=args.concurrency))

    simulate_failures(EVOLUTION_ENDPOINT)

    verify_s3_retention(AWS_BUCKET, S3_PREFIXES)

    for service, counter in stats.items():
        total = sum(v for k, v in counter.items() if k.endswith("xx"))
        latency_avg = counter.get("latency_sum", 0.0) / max(total, 1)
        print(f"{service}: total={total} avg_latency={latency_avg:.3f}s distribution={{{k: counter[k] for k in counter if k.endswith('xx')}}}")


if __name__ == "__main__":
    main()
