export interface NaiscItemDescriptor {
  readonly type: string;
  readonly position: {
    x: number;
    y: number;
  };
  readonly pins: {
    readonly in: NaiscPinDescriptor[];
    readonly out: NaiscPinDescriptor[];
  };
  readonly state: {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
  };
}

export interface NaiscPinDescriptor {
  type: string;
  multiple: boolean;
}
