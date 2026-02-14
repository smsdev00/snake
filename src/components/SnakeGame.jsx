import { useEffect, useRef } from 'react';

const CELL_SIZE = 25;
const BG_COLOR = '#1a1a2e';
const GRID_COLOR = '#16213e';
const SNAKE_COLOR = '#4ade80';
const SNAKE_HEAD_COLOR = '#22c55e';
const FOOD_COLOR = '#ef4444';

const KEY_MAP = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
};

export default function SnakeGame({ engine, tickInterval, onScoreChange }) {
  const canvasRef = useRef(null);
  const lastTickRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = engine.gridSize * CELL_SIZE;
    canvas.width = size;
    canvas.height = size;

    function draw() {
      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, size, size);

      // Grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= engine.gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(size, i * CELL_SIZE);
        ctx.stroke();
      }

      // Food
      ctx.fillStyle = FOOD_COLOR;
      ctx.beginPath();
      const fx = engine.food.x * CELL_SIZE + CELL_SIZE / 2;
      const fy = engine.food.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Snake
      engine.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? SNAKE_HEAD_COLOR : SNAKE_COLOR;
        const pad = 1;
        ctx.fillRect(
          seg.x * CELL_SIZE + pad,
          seg.y * CELL_SIZE + pad,
          CELL_SIZE - pad * 2,
          CELL_SIZE - pad * 2,
        );
      });

      // Game Over overlay
      if (engine.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', size / 2, size / 2 - 20);
        ctx.font = '20px monospace';
        ctx.fillText(`Score: ${engine.score}`, size / 2, size / 2 + 20);
        ctx.font = '16px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press Space or Enter to restart', size / 2, size / 2 + 55);
      }
    }

    function loop(timestamp) {
      if (timestamp - lastTickRef.current >= tickInterval) {
        engine.update();
        onScoreChange(engine.score);
        lastTickRef.current = timestamp;
      }
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [engine, tickInterval, onScoreChange]);

  useEffect(() => {
    function handleKey(e) {
      if (KEY_MAP[e.key]) {
        e.preventDefault();
        engine.setDirection(KEY_MAP[e.key]);
      }
      if ((e.key === ' ' || e.key === 'Enter') && engine.gameOver) {
        e.preventDefault();
        engine.reset();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', border: '2px solid #333', borderRadius: 4 }}
    />
  );
}
