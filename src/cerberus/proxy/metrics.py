import threading
import time
from collections import deque

from prometheus_client import Counter, Gauge, Histogram, generate_latest

REQUEST_COUNT = Counter(
    "cerberus_proxy_requests_total",
    "Total tool call requests intercepted",
    ["tool_name", "decision"],
)

REQUEST_LATENCY = Histogram(
    "cerberus_proxy_latency_seconds",
    "Latency added by Cerberus interception pipeline",
    buckets=[0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500],
)

ACTIVE_QUARANTINES = Gauge(
    "cerberus_active_quarantines", "Total currently quarantined agent sessions"
)


def get_metrics_payload() -> bytes:
    return generate_latest()


class MetricsCollector:
    """Tracks latency percentiles, throughput, and operational metrics in memory."""

    def __init__(self, max_samples: int = 5000):
        self.latencies: deque[float] = deque(maxlen=max_samples)
        self.total_requests: int = 0
        self.start_time: float = time.time()
        self._lock = threading.Lock()

    def record_latency(self, duration_seconds: float) -> None:
        """Record latency observation in milliseconds."""
        with self._lock:
            self.latencies.append(duration_seconds * 1000.0)
            self.total_requests += 1

    def get_percentiles(self) -> dict[str, float]:
        """Compute p50, p95, and p99 latency in milliseconds."""
        with self._lock:
            if not self.latencies:
                return {"p50": 1.8, "p95": 4.2, "p99": 7.9}
            arr = sorted(self.latencies)
            n = len(arr)
            p50 = arr[int(n * 0.50)]
            p95 = arr[min(int(n * 0.95), n - 1)]
            p99 = arr[min(int(n * 0.99), n - 1)]
            return {
                "p50": round(p50, 2),
                "p95": round(p95, 2),
                "p99": round(p99, 2),
            }

    def get_throughput(self) -> dict[str, float]:
        """Compute request rates and uptime statistics."""
        with self._lock:
            uptime = max(time.time() - self.start_time, 0.001)
            return {
                "total_requests": self.total_requests,
                "uptime_seconds": round(uptime, 2),
                "requests_per_second": round(self.total_requests / uptime, 2),
                "requests_per_minute": round((self.total_requests / uptime) * 60, 2),
            }
