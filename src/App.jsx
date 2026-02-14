import { useMemo, useState, useCallback, useRef } from 'react';
import SnakeEngine from './engine/SnakeEngine';
import SnakeGame from './components/SnakeGame';
import './App.css';

const SPEEDS = [
  { label: 'Slow', ms: 200 },
  { label: 'Normal', ms: 120 },
  { label: 'Fast', ms: 70 },
];

export default function App() {
  const engine = useMemo(() => new SnakeEngine(), []);
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);

  const handleNewGame = useCallback(() => {
    engine.reset();
    setScore(0);
  }, [engine]);

  const handleAIToggle = useCallback(() => {
    if (gameRef.current) {
      console.log('AI Mode - current state:', gameRef.current.getState());
    }
  }, []);

  return (
    <div className="app">
      <h1>Snake</h1>
      <div className="toolbar">
        <span className="score">Score: {score}</span>
        <button onClick={handleNewGame}>New Game</button>
        <button onClick={handleAIToggle} disabled>
          AI Mode
        </button>
        <div className="speed-control">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              className={i === speedIdx ? 'active' : ''}
              onClick={() => setSpeedIdx(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <SnakeGame
        ref={gameRef}
        engine={engine}
        tickInterval={SPEEDS[speedIdx].ms}
        onScoreChange={setScore}
      />
      <p className="hint">Arrow keys to move</p>
    </div>
  );
}
