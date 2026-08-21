import { NavigationGrid, GridCell } from './NavigationGrid';

interface PathNode {
  cell: GridCell;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class AStarPathfinder {
  public static findPath(
    grid: NavigationGrid,
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    targetRadius: number = 0.5
  ): Array<{ x: number; z: number }> | null {
    const startG = grid.worldToGrid(startX, startZ);
    const targetG = grid.worldToGrid(targetX, targetZ);
    if (!startG || !targetG) return null;

    const startCell = grid.getCell(startG.x, startG.z);
    if (!startCell) return null;

    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: PathNode = {
      cell: startCell,
      g: 0,
      h: Math.hypot(startCell.worldX - targetX, startCell.worldZ - targetZ),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find lowest f
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openSet.splice(lowestIdx, 1)[0];
      const key = `${current.cell.x}_${current.cell.z}`;

      // Check if reached within target radius
      const distToTarget = Math.hypot(current.cell.worldX - targetX, current.cell.worldZ - targetZ);
      if (distToTarget <= targetRadius || (current.cell.x === targetG.x && current.cell.z === targetG.z)) {
        // Reconstruct path
        const path: Array<{ x: number; z: number }> = [];
        let curr: PathNode | null = current;
        while (curr) {
          path.push({ x: curr.cell.worldX, z: curr.cell.worldZ });
          curr = curr.parent;
        }
        path.reverse();
        return path;
      }

      closedSet.add(key);

      const neighbors = grid.getNeighbors(current.cell.x, current.cell.z);
      for (const neighbor of neighbors) {
        const nKey = `${neighbor.x}_${neighbor.z}`;
        if (closedSet.has(nKey)) continue;

        const isDiag = neighbor.x !== current.cell.x && neighbor.z !== current.cell.z;
        const moveCost = isDiag ? 1.414 * grid.cellSize : 1.0 * grid.cellSize;
        const gScore = current.g + moveCost;

        let existing = openSet.find((node) => node.cell.x === neighbor.x && node.cell.z === neighbor.z);
        if (!existing) {
          const hScore = Math.hypot(neighbor.worldX - targetX, neighbor.worldZ - targetZ);
          const newNode: PathNode = {
            cell: neighbor,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
          };
          openSet.push(newNode);
        } else if (gScore < existing.g) {
          existing.g = gScore;
          existing.f = existing.g + existing.h;
          existing.parent = current;
        }
      }
    }

    return null; // No direct path
  }
}
