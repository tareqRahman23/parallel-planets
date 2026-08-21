# Parallel Planets 🪐

A polished isometric 3D farm-management and base-invasion diorama game built with **Three.js**, **TypeScript**, and **Vite**.

![Tabletop Diorama Preview](https://raw.githubusercontent.com/google/antigravity/main/docs/parallel-planets-banner.png)

## Core Gameplay Loop

Parallel Planets demonstrates two parallel investment paths that prepare the player for the final launch:

```text
Mine Stone / fulfil orders
  -> Buy Rabbits and place Carrot patches
  -> Collect Fur and Fertilizer
  -> Build production machines and craft equipment
  -> Repair the rocket and choose a loadout
  -> Deploy creatures around an enemy base
  -> Use a limited orbital support power
  -> Earn stars, loot, and bring survivors home
```

> **"Stone builds your economy. Carrots build your army. Both prepare you for the launch."**

---

## Target Platform & Controls

- **Home Planet:** Left-click to collect, mine, place, or interact. Right-drag / middle-drag pans; wheel zooms; `Space` recenters.
- **Carrot placement:** Select the Carrot button, then click valid ground. Right-click or `Escape` cancels.
- **Enemy Planet:** Select a troop card, deploy on the green perimeter, then let creatures fight autonomously. Select the support card and click a target to fire it.
- **Sound Mute:** Audio button in top-right HUD

---

## Technology Stack

- **Rendering:** Three.js (Procedural low-poly diorama models, soft shadows, ACESFilmic tone mapping)
- **Language:** TypeScript
- **Bundler:** Vite
- **UI:** Responsive HTML5/CSS3 HUD matching expedition diorama aesthetics
- **Audio:** Real-time synthesized Web Audio API sound effects (no external audio files required)
- **Testing:** Vitest

---

## Project Structure

```text
parallel-planets/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── app/
│   │   ├── Game.ts
│   │   ├── GameConfig.ts
│   │   ├── GameEvents.ts
│   │   ├── GameLoop.ts
│   │   └── GameSession.ts
│   ├── core/
│   │   ├── AudioManager.ts
│   │   ├── CameraController.ts
│   │   ├── Collision.ts
│   │   ├── Disposable.ts
│   │   ├── Input.ts
│   │   └── Renderer.ts
│   ├── models/
│   │   ├── materials.ts
│   │   ├── createPlayerModel.ts
│   │   ├── createRabbitModel.ts
│   │   ├── createEnemyModel.ts
│   │   ├── createRocketModel.ts
│   │   ├── createDrillModel.ts
│   │   ├── createFarmModel.ts
│   │   ├── createRabbitPenModel.ts
│   │   ├── createEnemyCoreModel.ts
│   │   └── createEnvironmentModels.ts
│   ├── entities/
│   │   ├── Entity.ts
│   │   ├── Player.ts
│   │   ├── StoneNode.ts
│   │   ├── DrillSite.ts
│   │   ├── FarmPlot.ts
│   │   ├── RabbitPen.ts
│   │   ├── ArmoredRabbit.ts
│   │   ├── Rocket.ts
│   │   ├── Enemy.ts
│   │   └── EnemyCore.ts
│   ├── systems/
│   │   ├── InteractionSystem.ts
│   │   ├── CombatSystem.ts
│   │   ├── CombatRules.ts
│   │   └── ObjectiveSystem.ts
│   ├── effects/
│   │   ├── ParticleBurst.ts
│   │   └── FloatingText.ts
│   ├── worlds/
│   │   ├── World.ts
│   │   ├── WorldManager.ts
│   │   ├── HomeWorld.ts
│   │   └── EnemyWorld.ts
│   └── ui/
│       ├── HUD.ts
│       ├── ObjectiveDisplay.ts
│       ├── VictoryScreen.ts
│       └── DefeatScreen.ts
└── tests/
    ├── GameSession.test.ts
    ├── FarmPlot.test.ts
    └── CombatRules.test.ts
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 3. Run Automated Unit Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## Verification & Key Systems

1. **Farm Frenzy home loop:** pointer-driven food placement, loose product collection, creature growth, production chains, warehouse pressure, and periodic raids.
2. **Clash-style invasion loop:** perimeter deployment, A* routing through destructible walls, autonomous creature targeting, defenses, support powers, loot escrow, and three-star scoring.
3. **Free asset integration:** locally bundled Polyfork carrot, forest rabbit, and space mine models supplement the procedural Three.js scene art.
