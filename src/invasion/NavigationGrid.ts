export interface GridCell {
  x: number; // grid coordinate
  z: number;
  worldX: number;
  worldZ: number;
  isWalkable: boolean;
  occupantId: string | null;
}

export class NavigationGrid {
  public readonly cellSize: number = 0.8;
  public readonly boundsMin: number = -12.0;
  public readonly boundsMax: number = 12.0;
  public readonly gridWidth: number;
  public readonly gridHeight: number;
  public readonly cells: GridCell[][];

  constructor(cellSize: number = 0.8) {
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil((this.boundsMax - this.boundsMin) / this.cellSize);
    this.gridHeight = Math.ceil((this.boundsMax - this.boundsMin) / this.cellSize);

    this.cells = [];
    for (let x = 0; x < this.gridWidth; x++) {
      this.cells[x] = [];
      for (let z = 0; z < this.gridHeight; z++) {
        const worldX = this.boundsMin + (x + 0.5) * this.cellSize;
        const worldZ = this.boundsMin + (z + 0.5) * this.cellSize;
        const distSq = worldX * worldX + worldZ * worldZ;
        const insideIsland = distSq <= 11.5 * 11.5;

        this.cells[x][z] = {
          x,
          z,
          worldX,
          worldZ,
          isWalkable: insideIsland,
          occupantId: null,
        };
      }
    }
  }

  public worldToGrid(worldX: number, worldZ: number): { x: number; z: number } | null {
    if (worldX < this.boundsMin || worldX >= this.boundsMax || worldZ < this.boundsMin || worldZ >= this.boundsMax) {
      return null;
    }
    const gx = Math.floor((worldX - this.boundsMin) / this.cellSize);
    const gz = Math.floor((worldZ - this.boundsMin) / this.cellSize);
    if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridHeight) return null;
    return { x: gx, z: gz };
  }

  public gridToWorld(gx: number, gz: number): { x: number; z: number } {
    return {
      x: this.boundsMin + (gx + 0.5) * this.cellSize,
      z: this.boundsMin + (gz + 0.5) * this.cellSize,
    };
  }

  public getCell(gx: number, gz: number): GridCell | null {
    if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridHeight) return null;
    return this.cells[gx][gz];
  }

  public markBlocker(centerX: number, centerZ: number, radius: number, occupantId: string, isWalkable: boolean = false): void {
    const minG = this.worldToGrid(centerX - radius, centerZ - radius);
    const maxG = this.worldToGrid(centerX + radius, centerZ + radius);
    if (!minG || !maxG) return;

    for (let x = Math.max(0, minG.x); x <= Math.min(this.gridWidth - 1, maxG.x); x++) {
      for (let z = Math.max(0, minG.z); z <= Math.min(this.gridHeight - 1, maxG.z); z++) {
        const cell = this.cells[x][z];
        const d = Math.hypot(cell.worldX - centerX, cell.worldZ - centerZ);
        if (d <= radius) {
          cell.isWalkable = isWalkable;
          cell.occupantId = isWalkable ? null : occupantId;
        }
      }
    }
  }

  public removeBlocker(occupantId: string): void {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let z = 0; z < this.gridHeight; z++) {
        const cell = this.cells[x][z];
        if (cell.occupantId === occupantId) {
          const distSq = cell.worldX * cell.worldX + cell.worldZ * cell.worldZ;
          cell.isWalkable = distSq <= 11.5 * 11.5;
          cell.occupantId = null;
        }
      }
    }
  }

  public getNeighbors(gx: number, gz: number): GridCell[] {
    const neighbors: GridCell[] = [];
    const dirs = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
      { dx: 1, dz: 1 },
      { dx: 1, dz: -1 },
      { dx: -1, dz: 1 },
      { dx: -1, dz: -1 },
    ];

    for (const d of dirs) {
      const nx = gx + d.dx;
      const nz = gz + d.dz;
      const cell = this.getCell(nx, nz);
      if (!cell || !cell.isWalkable) continue;

      // Prevent diagonal corner-cutting through blocked orthogonal cells
      if (d.dx !== 0 && d.dz !== 0) {
        const adj1 = this.getCell(gx + d.dx, gz);
        const adj2 = this.getCell(gx, gz + d.dz);
        if (!adj1?.isWalkable || !adj2?.isWalkable) {
          continue;
        }
      }

      neighbors.push(cell);
    }

    return neighbors;
  }
}
