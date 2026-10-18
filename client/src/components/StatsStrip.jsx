import { useEffect, useRef, useState } from 'react';

function useAnimatedValue(value, duration = 600) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationRef = useRef(null);

  useEffect(() => {
    const previousValue = previousValueRef.current;
    if (previousValue === value) return;

    const startTime = performance.now();
    const startValue = previousValue;
    const endValue = value;
    const isNumeric = typeof startValue === 'number' && typeof endValue === 'number';

    if (!isNumeric) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = value;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
}

export default function StatsStrip({ stats }) {
  const totalTrades = useAnimatedValue(stats?.totalTrades ?? '—');
  const uniqueSymbols = useAnimatedValue(stats?.uniqueSymbols ?? '—');
  const lastPullAt = stats?.lastPullAt
    ? new Date(stats.lastPullAt).toLocaleString('en-IN')
    : '—';

  return (
    <section className="stats-strip" aria-label="Trade statistics">
      <div className="stat-card">
        <span className="label">Total trades</span>
        <span className="value">{totalTrades}</span>
      </div>
      <div className="stat-card">
        <span className="label">Unique symbols</span>
        <span className="value">{uniqueSymbols}</span>
      </div>
      <div className="stat-card">
        <span className="label">Last pull</span>
        <span className="value">{lastPullAt}</span>
      </div>
    </section>
  );
}
