interface ScoreBarProps {
  score: number;
  maxScore: number;
}

const ScoreBar = ({ score, maxScore }: ScoreBarProps) => {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className="h-full rounded bg-teal-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default ScoreBar;
