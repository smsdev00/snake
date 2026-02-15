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

// Ray-cast: normalized distance to first obstacle in given direction
function rayDistance(head, dx, dy, state) {
  const gs = state.gridSize;
  let x = head.x + dx;
  let y = head.y + dy;
  let dist = 1;

  while (x >= 0 && x < gs && y >= 0 && y < gs
    && !state.snake.some(seg => seg.x === x && seg.y === y)) {
    x += dx;
    y += dy;
    dist++;
  }

  return dist / gs;
}

function floodFillFrom(startX, startY, state, occupied) {
  const gs = state.gridSize;
  const key = (x, y) => `${x},${y}`;

  if (startX < 0 || startX >= gs || startY < 0 || startY >= gs
    || occupied.has(key(startX, startY))) {
    return 0;
  }

  const visited = new Set();
  const queue = [{ x: startX, y: startY }];
  visited.add(key(startX, startY));
  let count = 0;

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    count++;
    for (const d of Object.values(DIRECTION_DELTAS)) {
      const nx = x + d.x;
      const ny = y + d.y;
      const k = key(nx, ny);
      if (nx >= 0 && nx < gs && ny >= 0 && ny < gs && !occupied.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return count;
}

export function extractFeatures(state) {
  const head = state.snake[0];
  const tail = state.snake[state.snake.length - 1];
  const dir = state.direction;
  const rel = RELATIVE[dir];
  const gs = state.gridSize;

  // Danger in each relative direction (1 step)
  const straightDelta = DIRECTION_DELTAS[rel.straight];
  const rightDelta = DIRECTION_DELTAS[rel.right];
  const leftDelta = DIRECTION_DELTAS[rel.left];

  const dangerStraight = isCollision(head.x + straightDelta.x, head.y + straightDelta.y, state) ? 1 : 0;
  const dangerRight = isCollision(head.x + rightDelta.x, head.y + rightDelta.y, state) ? 1 : 0;
  const dangerLeft = isCollision(head.x + leftDelta.x, head.y + leftDelta.y, state) ? 1 : 0;

  // Danger in each relative direction (2 steps)
  const dangerStraight2 = isCollision(head.x + straightDelta.x * 2, head.y + straightDelta.y * 2, state) ? 1 : 0;
  const dangerRight2 = isCollision(head.x + rightDelta.x * 2, head.y + rightDelta.y * 2, state) ? 1 : 0;
  const dangerLeft2 = isCollision(head.x + leftDelta.x * 2, head.y + leftDelta.y * 2, state) ? 1 : 0;

  // Ray-cast distance in each relative direction (normalized)
  const rayStraight = rayDistance(head, straightDelta.x, straightDelta.y, state);
  const rayRight = rayDistance(head, rightDelta.x, rightDelta.y, state);
  const rayLeft = rayDistance(head, leftDelta.x, leftDelta.y, state);

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

  // Wall distances (normalized)
  const wallUp    = head.y / gs;
  const wallDown  = (gs - 1 - head.y) / gs;
  const wallLeft  = head.x / gs;
  const wallRight = (gs - 1 - head.x) / gs;

  // Snake length (normalized)
  const snakeLength = state.snake.length / (gs * gs);

  // Build occupied set once for all flood fills
  const occupied = new Set(state.snake.map(s => `${s.x},${s.y}`));

  // Global flood fill ratio
  const totalFree = gs * gs - state.snake.length;
  const reachable = floodFillFrom(head.x, head.y, state, occupied);
  const floodRatio = totalFree > 0 ? reachable / totalFree : 0;

  // Directional flood fill: reachable space from cell in each relative direction
  const floodStraight = floodFillFrom(head.x + straightDelta.x, head.y + straightDelta.y, state, occupied);
  const floodRight = floodFillFrom(head.x + rightDelta.x, head.y + rightDelta.y, state, occupied);
  const floodLeft = floodFillFrom(head.x + leftDelta.x, head.y + leftDelta.y, state, occupied);
  const floodMax = Math.max(totalFree, 1);

  // Tail relative direction (sign)
  const tailDx = Math.sign(tail.x - head.x);
  const tailDy = Math.sign(tail.y - head.y);

  return [
    dangerStraight, dangerRight, dangerLeft,
    dangerStraight2, dangerRight2, dangerLeft2,
    rayStraight, rayRight, rayLeft,
    dirUp, dirRight, dirDown, dirLeft,
    foodUp, foodRight, foodDown, foodLeft,
    wallUp, wallRight, wallDown, wallLeft,
    snakeLength,
    floodRatio,
    floodStraight / floodMax, floodRight / floodMax, floodLeft / floodMax,
    tailDx, tailDy,
  ];
}
