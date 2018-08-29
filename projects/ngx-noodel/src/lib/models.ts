export interface ViewProjection {
  x?: number;
  y?: number;
  z?: number;
}

export interface NoodelItemDescriptor {
  type: string;
  position: { x: number, y: number };

  state: { [key: string]: string | number | boolean | string[] | number[] | boolean[] };
}
