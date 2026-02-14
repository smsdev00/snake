const GRID_SIZE = 20;

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const ACTIONS = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

export default class SnakeEngine {
  constructor() {
    this.gridSize = GRID_SIZE;
    this.reset();
  }

  reset() {
    const mid = Math.floor(this.gridSize / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score = 0;
    this.gameOver = false;
    this.stepsWithoutFood = 0;
    this.food = this._spawnFood();
    return this.getState();
  }

  getState() {
    return {
      snake: this.snake.map(s => ({ ...s })),
      food: { ...this.food },
      direction: this.direction,
      score: this.score,
      gameOver: this.gameOver,
      gridSize: this.gridSize,
    };
  }

  step(action) {
    const dir = ACTIONS[action];
    if (dir) this.setDirection(dir);

    const head = this.snake[0];
    const prevDist = Math.abs(head.x - this.food.x) + Math.abs(head.y - this.food.y);
    const prevScore = this.score;

    this.update();

    let reward = 0;
    if (this.gameOver) {
      reward = -10;
    } else if (this.score > prevScore) {
      reward = 10;
      this.stepsWithoutFood = 0;
    } else {
      this.stepsWithoutFood++;
      // Timeout: too many steps without eating
      if (this.stepsWithoutFood > this.gridSize * this.gridSize) {
        this.gameOver = true;
        reward = -10;
      } else {
        const newHead = this.snake[0];
        const newDist = Math.abs(newHead.x - this.food.x) + Math.abs(newHead.y - this.food.y);
        reward = newDist < prevDist ? 1 : -1;
      }
    }

    return {
      state: this.getState(),
      reward,
      done: this.gameOver,
    };
  }

  setDirection(dir) {
    if (OPPOSITE[dir] === this.direction) return;
    this.nextDirection = dir;
  }

  update() {
    if (this.gameOver) return;

    this.direction = this.nextDirection;
    const delta = DIRECTIONS[this.direction];
    const head = this.snake[0];
    const newHead = { x: head.x + delta.x, y: head.y + delta.y };

    // Wall collision
    if (
      newHead.x < 0 || newHead.x >= this.gridSize ||
      newHead.y < 0 || newHead.y >= this.gridSize
    ) {
      this.gameOver = true;
      return;
    }

    // Self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.gameOver = true;
      return;
    }

    this.snake.unshift(newHead);

    // Eat food
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.food = this._spawnFood();
    } else {
      this.snake.pop();
    }
  }

  _spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    return free[Math.floor(Math.random() * free.length)];
  }
}
