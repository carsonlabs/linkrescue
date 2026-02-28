'use client';

interface HealthScoreGaugeProps {
  score: number;
  previousScore?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthScoreGauge({ score, previousScore, size = 'md' }: HealthScoreGaugeProps) {
  const sizeConfig = {
    sm: { w: 80, stroke: 6, text: 'text-lg', label: 'text-[10px]' },
    md: { w: 120, stroke: 8, text: 'text-3xl', label: 'text-xs' },
    lg: { w: 160, stroke: 10, text: 'text-4xl', label: 'text-sm' },
  }[size];

  const radius = (sizeConfig.w - sizeConfig.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#22c55e', text: 'text-green-400', bg: 'text-green-500/20' };
    if (s >= 60) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'text-yellow-500/20' };
    if (s >= 40) return { stroke: '#f97316', text: 'text-orange-400', bg: 'text-orange-500/20' };
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'text-red-500/20' };
  };

  const color = getColor(score);
  const trend = previousScore != null ? score - previousScore : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: sizeConfig.w, height: sizeConfig.w }}>
        <svg
          width={sizeConfig.w}
          height={sizeConfig.w}
          className="-rotate-90"
          viewBox={`0 0 ${sizeConfig.w} ${sizeConfig.w}`}
        >
          {/* Background circle */}
          <circle
            cx={sizeConfig.w / 2}
            cy={sizeConfig.w / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizeConfig.stroke}
            className="text-white/5"
          />
          {/* Progress arc */}
          <circle
            cx={sizeConfig.w / 2}
            cy={sizeConfig.w / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={sizeConfig.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold ${sizeConfig.text} ${color.text}`}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`${sizeConfig.label} text-slate-500`}>Health Score</span>
        {trend !== null && trend !== 0 && (
          <span
            className={`${sizeConfig.label} font-medium ${
              trend > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>
    </div>
  );
}
