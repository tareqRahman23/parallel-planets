import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationGrid } from '../src/invasion/NavigationGrid';
import { AStarPathfinder } from '../src/invasion/AStarPathfinder';

describe('Navigation Grid & A* Pathfinder', () => {
  let grid: NavigationGrid;

  beforeEach(() => {
    grid = new NavigationGrid(0.8);
  });

  it('creates grid with valid bounds and walkable island interior', () => {
    expect(grid.gridWidth).toBeGreaterThan(20);
    expect(grid.gridHeight).toBeGreaterThan(20);

    const centerCell = grid.worldToGrid(0, 0);
    expect(centerCell).not.toBeNull();
    const cell = grid.getCell(centerCell!.x, centerCell!.z);
    expect(cell?.isWalkable).toBe(true);
  });

  it('finds a direct path between start and end points in open terrain', () => {
    const path = AStarPathfinder.findPath(grid, -8, -8, 0, 0, 1.0);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(1);
    expect(path![0].x).toBeCloseTo(-8, 0);
  });

  it('routes around marked obstacles / walls', () => {
    // Mark a wall blocker across the middle
    grid.markBlocker(0, 0, 2.0, 'wall_blocker', false);

    const path = AStarPathfinder.findPath(grid, -5, 0, 5, 0, 1.0);
    expect(path).not.toBeNull();

    // Verify none of the path points pass directly through the center blocker
    for (const pt of path!) {
      const distToCenter = Math.hypot(pt.x, pt.z);
      expect(distToCenter).toBeGreaterThan(1.8);
    }
  });

  it('restores walkability when blocker is removed after destruction', () => {
    grid.markBlocker(0, 0, 2.0, 'test_obstacle', false);
    const centerG = grid.worldToGrid(0, 0)!;
    expect(grid.getCell(centerG.x, centerG.z)?.isWalkable).toBe(false);

    grid.removeBlocker('test_obstacle');
    expect(grid.getCell(centerG.x, centerG.z)?.isWalkable).toBe(true);
  });
});
