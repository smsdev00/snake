const DIRECTION_DELTAS = {
  UP:    { x: 0, y: -1 },
  RIGHT: { x: 1, y: 0 },
  DOWN:  { x: 0, y: 1 },
  LEFT:  { x: -1, y: 0 },
};

// Relative turns: given current direction, what's straight/right/left
const RELATIVE = {
  UP:    { straight: 'UP',    right: 'RIGHT', left: 'LEFT'  },
  RIGHT: { straight: 'RIGHT', right: 'DOWN',  left: 'UP'    },
  DOWN:  { straight: 'DOWN',  right: 'LEFT',  left: 'RIGHT' },
  LEFT:  { straight: 'LEFT',  right: 'UP',    left: 'DOWN'  },
};

function isCollision(x, y, state) {
  if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return true;
  return state.snake.some(seg => seg.x === x && seg.y === y);
}

export function extractFeatures(state) {
  const head = state.snake[0];
  const dir = state.direction;
  const rel = RELATIVE[dir];

  // Danger in each relative direction
  const straightDelta = DIRECTION_DELTAS[rel.straight];
  const rightDelta = DIRECTION_DELTAS[rel.right];
  const leftDelta = DIRECTION_DELTAS[rel.left];

  const dangerStraight = isCollision(head.x + straightDelta.x, head.y + straightDelta.y, state) ? 1 : 0;
  const dangerRight = isCollision(head.x + rightDelta.x, head.y + rightDelta.y, state) ? 1 : 0;
  const dangerLeft = isCollision(head.x + leftDelta.x, head.y + leftDelta.y, state) ? 1 : 0;

  // Direction one-hot
  const dirUp    = dir === 'UP'    ? 1 : 0;
  const dirRight = dir === 'RIGHT' ? 1 : 0;
  const dirDown  = dir === 'DOWN'  ? 1 : 0;
  const dirLeft  = dir === 'LEFT'  ? 1 : 0;

  // Food relative to head
  const foodUp    = state.food.y < head.y ? 1 : 0;
  const foodRight = state.food.x > head.x ? 1 : 0;
  const foodDown  = state.food.y > head.y ? 1 : 0;
  const foodLeft  = state.food.x < head.x ? 1 : 0;

  return [
    dangerStraight, dangerRight, dangerLeft,
    dirUp, dirRight, dirDown, dirLeft,
    foodUp, foodRight, foodDown, foodLeft,
  ];
}
