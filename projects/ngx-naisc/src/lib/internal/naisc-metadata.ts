import {NaiscItemDescriptor} from '../shared/naisc-item-descriptor';


export class NaiscMetadata {
  public type: string;
  public factory: () => NaiscItemDescriptor;
}
