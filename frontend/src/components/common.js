const InflationTimestamp = 1621623768597;
const HalflifeDuration = 2628000000;

export const multiplier = () => {
  const timestamp = new Date().getTime();
  const duration = timestamp - InflationTimestamp;
  return Math.pow(2, duration / HalflifeDuration);
}
