# Snake RL

Snake clásico implementado en el navegador con un agente de Reinforcement Learning (DQN) que entrena directamente en el browser usando TensorFlow.js.

## Stack

- Vite + React
- Canvas 2D para renderizado
- TensorFlow.js

## Instalación

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Cómo usar

### Modo Human (por defecto)

- Usa las **flechas del teclado** para mover la serpiente.
- Come la comida roja para crecer y sumar puntos.
- Evita chocar contra las paredes o contra tu propio cuerpo.
- Pulsa **Space** o **Enter** para reiniciar después de un Game Over.
- Cambia la velocidad con los botones **Slow / Normal / Fast**.

### Modo Training (entrenar la IA)

1. Pulsa el botón **Train** en el panel debajo del tablero.
2. El agente DQN entrena en segundo plano (headless, sin renderizar) ejecutando miles de episodios.
3. El panel muestra estadísticas en tiempo real:
   - **Episode**: número de episodio actual
   - **Epsilon**: probabilidad de acción aleatoria (baja a medida que aprende)
   - **Avg Reward**: recompensa promedio de los últimos 100 episodios
   - **Best Score**: mejor puntuación alcanzada
4. Pulsa **Stop Training** cuando quieras detener el entrenamiento.

> Recomendación: deja entrenar al menos 500-1000 episodios para ver resultados decentes. Epsilon debería bajar por debajo de 0.1.

### Modo Watch AI Play (ver la IA jugar)

1. Después de entrenar, pulsa **Watch AI Play**.
2. La serpiente se mueve sola usando el modelo entrenado.
3. El teclado queda desactivado mientras la IA juega.
4. Pulsa **Stop Watching** para volver al modo humano.

## Arquitectura

```
src/
├── agent/
│   ├── features.js          # Extrae 11 features binarios del estado
│   └── DQNAgent.js          # Agente DQN con TensorFlow.js
├── components/
│   ├── SnakeGame.jsx        # Canvas + game loop + soporte modo AI
│   └── TrainingPanel.jsx    # Panel de controles y stats de entrenamiento
├── engine/
│   └── SnakeEngine.js       # Lógica pura: grid, snake, colisiones, reward shaping
├── App.jsx                  # Orquestación de los tres modos
└── App.css
```

## Fases de desarrollo

### Fase 1: Juego jugable

Juego Snake funcional controlado con teclado.

- Grid 20x20 renderizado en canvas
- Controles con flechas del teclado
- Colisiones con paredes y cuerpo
- Score y selector de velocidad (Slow / Normal / Fast)
- Game Over con reinicio (Space/Enter)

### Fase 2: API para IA

Motor expuesto como API que un agente puede consumir.

- `getState()` — representación numérica del estado del juego
- `step(action)` — ejecutar una acción y recibir reward
- `reset()` — reiniciar episodio
- Acceso via `forwardRef` desde React

### Fase 3: Agente DQN

Agente Deep Q-Network que entrena y juega en el navegador.

- **Features (11 inputs)**: peligro recto/derecha/izquierda, dirección actual (one-hot), posición relativa de la comida
- **Red neuronal**: 11 → 256 (ReLU) → 64 (ReLU) → 4 (linear)
- **Reward shaping**: +10 comer, -10 morir, +1 acercarse a comida, -1 alejarse
- **Timeout**: game over si la serpiente da más de 400 pasos sin comer
- **Entrenamiento headless**: loop rápido sin renderizado para máxima velocidad
- **Modo visual**: ver al agente entrenado jugar en tiempo real

#### Hiperparámetros

| Parámetro     | Valor  |
| ------------- | ------ |
| Replay buffer | 50,000 |
| Batch size    | 64     |
| Gamma         | 0.95   |
| Epsilon start | 1.0    |
| Epsilon min   | 0.01   |
| Epsilon decay | 0.995  |
| Learning rate | 0.001  |
