import {NaiscItemDescriptor} from './naisc-item-descriptor';


export interface NaiscDump {
  items: NaiscItemDescriptor[];
  links: NaiscLinkDump[][][];
}

export interface NaiscLinkDump {
  pinIdx: number;
  itemIdx: number;
}
