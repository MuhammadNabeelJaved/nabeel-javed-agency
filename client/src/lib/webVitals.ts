import type { Metric } from 'web-vitals';

function logToConsole(metric: Metric): void {
  const { name, value, rating } = metric;
  const color =
    rating === 'good' ? '#22c55e' :
    rating === 'needs-improvement' ? '#f59e0b' :
    '#ef4444';
  console.log(
    `%c[Web Vitals] ${name}: ${Math.round(value)}${name === 'CLS' ? '' : 'ms'} — ${rating}`,
    `color: ${color}; font-weight: bold`
  );
}

function sendToBackend(metric: Metric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/v1/health/vitals',
        new Blob([body], { type: 'application/json' })
      );
    } else {
      fetch('/api/v1/health/vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fire-and-forget — never throw
  }
}

export function reportWebVitals(): void {
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    const handler = (metric: Metric) => {
      if (import.meta.env.DEV) {
        logToConsole(metric);
      } else {
        sendToBackend(metric);
      }
    };
    onCLS(handler);
    onFCP(handler);
    onLCP(handler);
    onTTFB(handler);
    onINP(handler);
  });
}
