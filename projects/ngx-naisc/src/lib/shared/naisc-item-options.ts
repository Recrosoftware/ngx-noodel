import {NaiscPinDescriptor} from './naisc-item-descriptor';


export interface NaiscItemOptions {
  autoInject: boolean;
  permanent: boolean;
  inputPins: NaiscPinDescriptor[];
  outputPins: NaiscPinDescriptor[];
}
