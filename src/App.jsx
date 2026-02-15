import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import SnakeEngine from './engine/SnakeEngine';
import SnakeGame from './components/SnakeGame';
import TrainingPanel from './components/TrainingPanel';
import DQNAgent from './agent/DQNAgent';
import { extractFeatures } from './agent/features';
import './App.css';

const SPEEDS = [
  { label: 'Slow', ms: 200 },
  { label: 'Normal', ms: 120 },
  { label: 'Fast', ms: 70 },
];

export default function App() {
  const engine = useMemo(() => new SnakeEngine(), []);
  const gameRef = useRef(null);
  const agentRef = useRef(null);
  const trainingRef = useRef(false);
  const [score, setScore] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [aiMode, setAiMode] = useState('human'); // 'human' | 'training' | 'playing'
  const [aiAction, setAiAction] = useState(null);
  const [trainingStats, setTrainingStats] = useState({
    episode: 0, epsilon: 1.0, avgReward: 0, bestScore: 0,
  });

  const [modelLoaded, setModelLoaded] = useState(false);

  // Lazily create agent, auto-load saved model
  function getAgent() {
    if (!agentRef.current || agentRef.current.disposed) {
      agentRef.current = new DQNAgent();
      agentRef.current.load().then((ok) => {
        if (ok) {
          setModelLoaded(true);
          setTrainingStats(s => ({ ...s, epsilon: agentRef.current.epsilon }));
        }
      });
    }
    return agentRef.current;
  }

  // Initialize agent on mount to trigger auto-load
  useEffect(() => { getAgent(); }, []);

  const handleNewGame = useCallback(() => {
    engine.reset();
    setScore(0);
  }, [engine]);

  // --- Training (headless) ---
  const startTraining = useCallback(() => {
    setAiMode('training');
    trainingRef.current = true;
    const agent = getAgent();
    const trainEngine = new SnakeEngine();

    const rewardHistory = [];
    let episode = 0;
    let bestScore = trainingStats.bestScore;

    // Persistent state across frames
    let state = trainEngine.reset();
    let features = extractFeatures(state);
    let totalReward = 0;
    let episodesDone = 0;

    function trainingLoop() {
      if (!trainingRef.current) return;

      const deadline = performance.now() + 12;
      episodesDone = 0;

      while (performance.now() < deadline && trainingRef.current) {
        const action = agent.act(features);
        const result = trainEngine.step(action);
        const nextFeatures = extractFeatures(result.state);
        agent.remember(features, action, result.reward, nextFeatures, result.done);
        totalReward += result.reward;
        features = nextFeatures;
        state = result.state;

        if (result.done) {
          episode++;
          episodesDone++;
          agent.decayEpsilon();
          rewardHistory.push(totalReward);
          if (rewardHistory.length > 100) rewardHistory.shift();
          if (state.score > bestScore) bestScore = state.score;

          state = trainEngine.reset();
          features = extractFeatures(state);
          totalReward = 0;
        }
      }

      if (!trainingRef.current) return;

      const avgReward = rewardHistory.length > 0
        ? rewardHistory.reduce((a, b) => a + b, 0) / rewardHistory.length
        : 0;
      setTrainingStats({ episode, epsilon: agent.epsilon, avgReward, bestScore });

      if (episodesDone > 0) {
        agent.train()
          .then(() => { rafRef.current = requestAnimationFrame(trainingLoop); })
          .catch((e) => { console.error('train error:', e); rafRef.current = requestAnimationFrame(trainingLoop); });
      } else {
        rafRef.current = requestAnimationFrame(trainingLoop);
      }
    }

    rafRef.current = requestAnimationFrame(trainingLoop);
  }, [trainingStats.bestScore]);

  const rafRef = useRef(null);

  const stopTraining = useCallback(() => {
    trainingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAiMode('human');
    if (agentRef.current && !agentRef.current.disposed) {
      agentRef.current.save()
        .then(() => setModelLoaded(true))
        .catch(() => {});
    }
  }, []);

  // --- AI Playing (visual) ---
  const aiPlayIntervalRef = useRef(null);

  const startPlaying = useCallback(() => {
    const agent = getAgent();
    engine.reset();
    setScore(0);
    setAiMode('playing');

    aiPlayIntervalRef.current = setInterval(() => {
      if (engine.gameOver) {
        engine.reset();
        setScore(0);
      }
      const state = engine.getState();
      const features = extractFeatures(state);
      const action = agent.actGreedy(features);
      setAiAction(action);
    }, 50);
  }, [engine]);

  const stopPlaying = useCallback(() => {
    if (aiPlayIntervalRef.current) {
      clearInterval(aiPlayIntervalRef.current);
      aiPlayIntervalRef.current = null;
    }
    setAiAction(null);
    setAiMode('human');
    engine.reset();
    setScore(0);
  }, [engine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trainingRef.current = false;
      if (aiPlayIntervalRef.current) clearInterval(aiPlayIntervalRef.current);
      if (agentRef.current) agentRef.current.dispose();
    };
  }, []);

  const handleTrain = useCallback(() => startTraining(), [startTraining]);
  const handleStop = useCallback(() => stopTraining(), [stopTraining]);
  const handleWatch = useCallback(() => {
    if (aiMode === 'playing') stopPlaying();
    else startPlaying();
  }, [aiMode, stopPlaying, startPlaying]);

  const handleExport = useCallback(async () => {
    const agent = getAgent();
    const json = await agent.exportToFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snake-dqn-model.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const agent = getAgent();
      await agent.importFromFile(text);
      await agent.save();
      setModelLoaded(true);
      setTrainingStats(s => ({ ...s, epsilon: agent.epsilon }));
    };
    input.click();
  }, []);

  const modeLabel = aiMode === 'human' ? 'Human' : aiMode === 'training' ? 'Training...' : 'AI Playing';

  return (
    <div className="app">
      <h1>Snake</h1>
      <div className="toolbar">
        <span className="score">Score: {score}</span>
        <button onClick={handleNewGame} disabled={aiMode !== 'human'}>New Game</button>
        <span className="mode-badge">{modeLabel}</span>
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
        aiAction={aiAction}
      />
      <TrainingPanel
        aiMode={aiMode}
        stats={trainingStats}
        onTrain={handleTrain}
        onWatch={handleWatch}
        onStop={handleStop}
        onExport={handleExport}
        onImport={handleImport}
        modelLoaded={modelLoaded}
      />
      <p className="hint">
        {aiMode === 'human' ? 'Arrow keys to move' : aiMode === 'training' ? 'Training in background...' : 'AI is playing'}
      </p>
    </div>
  );
}
