export interface NaiscItemDescriptor {
  type: string;
  permanent: boolean;
  position: {
    x: number;
    y: number;
  };
  pins: {
    in: NaiscPinDescriptor[];
    out: NaiscPinDescriptor[];
  };
  state: {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
  };
}

export interface NaiscPinDescriptor {
  type: string;
  multiple: boolean;
}
