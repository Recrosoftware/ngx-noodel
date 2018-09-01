import {TypeDecorator} from '@angular/core';

import {AUTO_INJECTED_CONTENTS} from '../internal/containers';
import {NaiscMetadata} from '../internal/naisc-metadata';
import {NaiscType} from '../internal/naisc-type';
import {NAISC_METADATA_ACCESSOR} from '../internal/symbols';

import {NaiscItemContent} from './naisc-item-content';
import {NaiscItemDescriptor} from './naisc-item-descriptor';

import {NaiscItemOptions} from './naisc-item-options';


const DEFAULT_OPTIONS: NaiscItemOptions = {
  autoInject: false,
  permanent: false,
  inputPins: [],
  outputPins: []
};

export function NaiscItem(type: string, opts?: Partial<NaiscItemOptions>): TypeDecorator {
  const options = {...DEFAULT_OPTIONS, ...opts};

  return (target: NaiscType) => {
    if (!(target.prototype instanceof NaiscItemContent)) {
      throw new Error(`Decorated class ${target.name} must extend 'NaiscItemContent' class.`);
    }

    if (options.autoInject) {
      if (AUTO_INJECTED_CONTENTS.indexOf(target) < 0) {
        AUTO_INJECTED_CONTENTS.push(target);
      }
    }

    const metadata = new NaiscMetadata();

    metadata.type = type;
    metadata.factory = () => {
      const descriptor: NaiscItemDescriptor = {
        type: type,
        permanent: options.permanent,
        position: Object.seal({x: 0, y: 0}),
        pins: Object.freeze({
          in: options.inputPins.slice(),
          out: options.outputPins.slice()
        }),
        state: {}
      };

      return Object.freeze(descriptor);
    };
    Object.seal(metadata);

    Object.defineProperty(target, NAISC_METADATA_ACCESSOR, {
      value: metadata,
      enumerable: false,
      configurable: false,
      writable: false
    });
  };
}
