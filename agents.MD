# Parallel Planets - Architectural Overview and Project Structure (Implementation 2)

This document serves as an orientation guide for AI agents and developers working on the `Parallel Planets` codebase. It outlines the core architectural patterns, state management, dual-mode gameplay systems, navigation grids, and file structure.

---

## Core Architecture

`Parallel Planets: Implementation 2` is built with a decoupled architecture using **Three.js** for rendering and **Vanilla DOM** for high-performance reactive UI overlays.

The architecture comprises two distinct game modes:
1. **HOME PLANET (Farm Frenzy-style mouse management)**:
   - Top purchase bar (Rabbits 50 Coins, Bulls 250 Coins).
   - Dynamic food placement (Carrot patches at 3 Coins, Fertilizer tool upgrade to 8 food units).
   - Loose product drops (Fur, Fertilizer, Stone, Thread, Fabric, Tech Part) with expiration timers and warehouse capacity checks.
   - 3 clickable Stone Nodes with 3 charges and 6s regeneration.
   - 5 Fixed Machine Pads (Mining Drill, Spinnery, Tailor, Stone Forge, Workshop Armory).
   - 3 Fixed Defense Pads (Pulse Turret, Snare Totem, Repair Beacon).
   - Alien Raids with 4-click manual caging, decay timers, and creature defense.
   - Emergency Market sales at lower liquidation prices.

2. **ENEMY PLANET (Clash of Clans-style base invasion)**:
   - Base preview phase with defense range indicators.
   - Perimeter troop deployment triggering a 180s battle timer.
   - 2D Navigation Grid & A* Pathfinding with destructible walls (`travelDistance / moveSpeed + wallHealth / DPS`).
   - 8 Counted Enemy Structures (Core, Plasma Cannons, Mortar cluster targeting, Resource Depots, Power Generators).
   - Orbital Support Powers (Orbital Sword line strike, Orbital Gun precision salvo).
   - 3-Star Rating System (50% destruction, Core destruction = Campaign Victory, 100% full destruction).
   - Permanent casualty resolution for fallen deployed units and 30s recovery for survivors.
   - Loot Escrow settlement (Tech Parts first, then Stone, auto-selling overflow).

---

## Code Structure (`/src`)

### `/app` (Application State & Lifecycle)
- `Game.ts`: Orchestrates renderer, input, audio, modals, HUD, and world manager.
- `GameSession.ts`: Single source of truth for inventory, economy, machines, defenses, creature roster, warehouse, and invasion state.
- `GameEvents.ts`: Typed event emitter for decoupling UI, audio, and entity state transitions.
- `GameLoop.ts`: `requestAnimationFrame` loop providing delta time steps.
- `GameConfig.ts`: Authoritative constants and game balance tuning.

### `/core` (Engine & Subsystems)
- `Renderer.ts`: Three.js WebGLRenderer, shadow map configuration, and canvas resizing.
- `Input.ts`: Pointer tracking, drag delta calculations, mouse wheel zoom, and UI event barriers.
- `CameraController.ts`: Isometric camera with smooth panning, zoom clamping, and screen shake.
- `AudioManager.ts`: Synthesizer using Web Audio API for sound effects (caging, collection, attacks, fanfares).
- `Collision.ts`: Mathematical intersection helpers.
- `Disposable.ts`: Geometry and material memory cleanup routines.

### `/home` (Home Planet Systems)
- `PlacementSystem.ts`: Interactive pointer raycasting, terrain validation, ghost previews for Carrot patches and Fertilizer.

### `/invasion` (Enemy Planet Systems)
- `NavigationGrid.ts`: 2D obstacle grid, blocker stamping, and 8-directional neighbor routing.
- `AStarPathfinder.ts`: Shortest-path pathfinding across destructible wall nodes.

### `/creatures` (Army & Feeding Data)
- `CreatureData.ts`: Stat calculations, growth thresholds (`Kit/Runner/Vanguard` and `Calf/Charger/Titan`), appetite timers, and multiplicative armor reduction.

### `/entities` (3D Interactive Objects)
- `Entity.ts`: `ICombatant` interface for damageable objects.
- `CreatureEntity.ts`: Rabbits and Bulls (feeding, thought bubbles, home raid defense, growth morphing).
- `CarrotPatchEntity.ts`: 3D soil mound, carrot models, fertilization visual indicators, and wilt decay.
- `LooseProductEntity.ts`: 3D loose goods (Fur, Fertilizer, Stone, Thread, Fabric, Tech Part), bobbing, warning pulse, and fly-to-HUD collection.
- `StoneNode.ts`: 3-charge mining node with visual pips and squash animation.
- `MachineEntity.ts`: Pad silhouettes, construction scaffolding, machine models, and output trays.
- `DefenseEntity.ts`: Pulse Turret, Snare Totem, Repair Beacon models and animations.
- `RaiderEntity.ts`: Scavengers, Brutes, 4 cage ring segments, carried sacks, and combat stuns.
- `EnemyBuildingEntity.ts`: 8 structures, 4 destruction stages, loot threshold triggers.
- `EnemyWallEntity.ts`: Destructible 220 HP wall segments with dynamic grid blocker removal.

### `/models` (Procedural 3D Geometry)
- `materials.ts`: Shared standard and emissive materials cache with palette constants.
- `createCreatureModels.ts`, `createRocketModel.ts`, `createDrillModel.ts`, `createFeedPressModel.ts`, `createFabricatorModel.ts`, `createWorkshopModel.ts`, `createEnvironmentModels.ts`.

### `/systems` (Simulation Logic)
- `SupplyOrderSystem.ts`: Contract generation, reward multipliers (+10% / +20% / +30% streak bonuses), and inventory validation.
- `ObjectiveSystem.ts`: Step-by-step tutorial and progression goals.

### `/ui` (Vanilla DOM Overlays)
- `HUD.ts`: Top bar (Coins, pop cap, buy buttons, warehouse gauge), supply order cards, tool selector, invasion tracker, and raid warning banners.
- `BuildModal.ts`: Machine construction chain and defense pads modal.
- `MarketModal.ts`: Emergency quick sales modal at fixed lower rates.
- `WorkshopModal.ts`: Crafting armory recipes (Rabbit Armor, Bull Armor, Support Powers, Rocket Repair, Cargo Expanders).
- `DeploymentModal.ts`: Rocket loadout, weight tracking, support power selection, and preset selectors.
- `RosterModal.ts`: Creature roster, stats, armor equipping, and recovery status.
- `VictoryScreen.ts`: 3-Star result display, loot escrow settlement, and casualty summary.
- `ObjectiveDisplay.ts`: Objective guidance banner.

### `/worlds` (Scene Orchestration)
- `World.ts`: Abstract base scene container.
- `HomeWorld.ts`: Farm Frenzy pointer-driven management, stone mining, product collection, machine pads, and raid defense.
- `EnemyWorld.ts`: Clash of Clans invasion arena, perimeter deployment, autonomous troop AI, defenses, and support powers.
- `WorldManager.ts`: Mode-driven world transitions with screen-fade overlays.

---

## Unit Testing (`/tests`)

The test suite runs with Vitest (`npm test -- --run`):
- `tests/AStarPathfinding.test.ts`: Grid walkability, blocker stamping, shortest-path calculation, obstacle avoidance.
- `tests/CreaturesAndGrowth.test.ts`: Delivery delays, carrot feeding thresholds, growth stages, multiplicative armor reduction.
- `tests/EconomyAndOrders.test.ts`: Order contracts, streak multipliers, emergency market liquidation.
- `tests/ProcessingSystem.test.ts`: Machine construction prerequisites, output trays, workshop recipe crafting.
- `tests/CombatAndWeapons.test.ts`: Defense pads, alien raid triggers, 4-click caging, cage segment decay.
- `tests/CombatRules.test.ts`: Perimeter deployment, 180s battle timer, 3-star conditions, loot escrow, survivor recovery.
- `tests/GameSession.test.ts`: Warehouse capacity, stone mining cooldowns, schema lifecycle.
- `tests/RocketAndDeployment.test.ts`: Capacity weights, cargo bay upgrades, loadout confirmations.
- `tests/FarmPlot.test.ts`: Carrot patch food units, fertilization, consumption.
- `tests/CraftingAndEquipment.test.ts`: Armor assigning rules, support power crafting, workshop queues.
