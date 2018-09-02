import {NaiscItemDescriptor, NaiscPinDescriptor} from '../shared/naisc-item-descriptor';


export type NaiscLinkEvent = NaiscLinkEventStart | NaiscLinkEventEnd | NaiscLinkEventAdd | NaiscLinkEventRemove;

export interface NaiscLinkEventStart {
  actionType: 'start';
  ref: {
    item: NaiscItemDescriptor;
    pin: NaiscPinDescriptor;
  };
}

export interface NaiscLinkEventEnd {
  actionType: 'end';
}

export interface NaiscLinkEventAdd {
  actionType: 'add';
  refFrom: {
    item: NaiscItemDescriptor;
    pin: NaiscPinDescriptor;
  };
  refTo: {
    item: NaiscItemDescriptor;
    pin: NaiscPinDescriptor;
  };
}

export interface NaiscLinkEventRemove {
  actionType: 'remove';
  refFrom: {
    item: NaiscItemDescriptor;
    pin: NaiscPinDescriptor;
  };
  refTo: {
    item: NaiscItemDescriptor;
    pin: NaiscPinDescriptor;
  };
}
