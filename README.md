# Snake RL

Snake clásico implementado en el navegador, diseñado como base para entrenar un agente de Reinforcement Learning.

## Objetivo

Construir un juego Snake completo en tres fases incrementales: primero jugable por humanos, luego con una API para agentes, y finalmente con un agente DQN que aprende a jugar solo.

## Stack

- Vite + React
- Canvas 2D para renderizado
- TensorFlow.js (Fase 3)

## Arquitectura

El motor de juego (`SnakeEngine`) es una clase JavaScript pura sin dependencias de React. Esto permite:

- Usarlo desde componentes React (Fase 1)
- Exponerlo como API para agentes externos (Fase 2)
- Ejecutarlo en modo headless a alta velocidad para entrenamiento (Fase 3)

```
src/
├── engine/
│   └── SnakeEngine.js      # Lógica pura: grid, snake, colisiones, score
├── components/
│   └── SnakeGame.jsx        # Canvas + game loop + input de teclado
├── App.jsx                  # Orquestación, UI de controles
└── App.css
```

## Fases

### Fase 1: Juego jugable (completada)

Juego Snake funcional controlado con teclado.

- Grid 20x20 renderizado en canvas
- Controles con flechas del teclado
- Colisiones con paredes y cuerpo
- Score y selector de velocidad (Slow / Normal / Fast)
- Game Over con reinicio (Space/Enter)

```bash
npm install
npm run dev
```

### Fase 2: API para IA

Exponer el motor como API que un agente pueda consumir.

- `getState()` — representación numérica del estado del juego
- `step(action)` — ejecutar una acción y recibir reward
- `reset()` — reiniciar episodio
- Acceso via `forwardRef` desde React

### Fase 3: Agente DQN

Modo headless y agente que aprende con Deep Q-Network.

- Modo headless (sin canvas) para entrenamiento rápido
- Agente DQN con TensorFlow.js
- Visualización del entrenamiento (reward por episodio, epsilon decay)
- Modo replay para ver al agente entrenado jugar
