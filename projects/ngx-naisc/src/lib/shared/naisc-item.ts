import {Type, TypeDecorator} from '@angular/core';

import {METADATA_ACCESSOR, NaiscMetadata} from '../internal';
import {AUTO_INJECTED} from '../internal/dynamic-content';
import {NaiscItemContent} from './naisc-item-content';
import {NaiscItemDescriptor} from './naisc-item-descriptor';

import {NaiscItemOptions} from './naisc-item-options';


const DEFAULT_OPTIONS: NaiscItemOptions = {
  autoInject: false
};

export function NaiscItem(type: string, opts?: Partial<NaiscItemOptions>): TypeDecorator {
  const options = {...DEFAULT_OPTIONS, ...opts};

  return (target: Type<any> & { [METADATA_ACCESSOR]: NaiscMetadata }) => {
    if (!(target.prototype instanceof NaiscItemContent)) {
      throw new Error(`Invalid target type '${target.name}', target must extend 'NaiscItemContent' class.`);
    }

    if (options.autoInject) {
      if (AUTO_INJECTED.indexOf(target) < 0) {
        AUTO_INJECTED.push(target);
      }
    }

    target[METADATA_ACCESSOR] = {
      type: type,
      factory() {
        return {
          type: type,
          position: {x: 0, y: 0},
          state: {}
        } as NaiscItemDescriptor;
      }
    };
  };
}
