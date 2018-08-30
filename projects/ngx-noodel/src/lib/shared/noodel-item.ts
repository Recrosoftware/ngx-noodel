import {Type, TypeDecorator} from '@angular/core';

import {METADATA_ACCESSOR, NoodelMetadata} from '../internal';
import {AUTO_INJECTED} from '../internal/dynamic-content';
import {NoodelItemContent} from './noodel-item-content';
import {NoodelItemDescriptor} from './noodel-item-descriptor';

import {NoodelItemOptions} from './noodel-item-options';


const DEFAULT_OPTIONS: NoodelItemOptions = {
  autoInject: false
};

export function NoodelItem(type: string, opts?: Partial<NoodelItemOptions>): TypeDecorator {
  const options = {...DEFAULT_OPTIONS, ...opts};

  return (target: Type<any> & { [METADATA_ACCESSOR]: NoodelMetadata }) => {
    if (!(target.prototype instanceof NoodelItemContent)) {
      throw new Error(`Invalid target type '${target.name}', target must extend 'NoodelItemContent' class.`);
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
        } as NoodelItemDescriptor;
      }
    };
  };
}
