export default function TrainingPanel({ aiMode, stats, onTrain, onWatch, onStop, onExport, onImport, modelLoaded }) {
  const busy = aiMode === 'training' || aiMode === 'playing';
  return (
    <div className="training-panel">
      <div className="training-controls">
        {aiMode === 'training' ? (
          <button onClick={onStop}>Stop Training</button>
        ) : (
          <button onClick={onTrain} disabled={aiMode === 'playing'}>
            Train
          </button>
        )}
        <button onClick={onWatch} disabled={aiMode === 'training'}>
          {aiMode === 'playing' ? 'Stop Watching' : 'Watch AI Play'}
        </button>
      </div>
      <div className="model-controls">
        <button onClick={onExport} disabled={busy || !modelLoaded}>
          Export Model
        </button>
        <button onClick={onImport} disabled={busy}>
          Import Model
        </button>
        {modelLoaded && <span className="model-badge">Model saved</span>}
      </div>
      <div className="training-stats">
        <span>Episode: {stats.episode}</span>
        <span>Epsilon: {stats.epsilon.toFixed(3)}</span>
        <span>Avg Reward: {stats.avgReward.toFixed(1)}</span>
        <span>Best Score: {stats.bestScore}</span>
      </div>
    </div>
  );
}
