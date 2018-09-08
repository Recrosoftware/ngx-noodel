import {NaiscPinDescriptor} from './naisc-item-descriptor';


export interface NaiscItemOptions {
  autoInject: boolean;
  inputPins: NaiscPinDescriptor[];
  outputPins: NaiscPinDescriptor[];
}
