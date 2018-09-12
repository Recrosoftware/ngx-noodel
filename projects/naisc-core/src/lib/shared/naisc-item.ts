import {TypeDecorator} from '@angular/core';

import {AUTO_INJECTED_CONTENTS} from '../internal/containers';
import {NaiscMetadata, NaiscType} from '../internal/models';
import {NAISC_METADATA_ACCESSOR} from '../internal/symbols';

import {NaiscItemContent} from './naisc-item-content';
import {NaiscItemDescriptor} from './naisc-item-descriptor';

import {NaiscItemOptions} from './naisc-item-options';


const DEFAULT_OPTIONS: NaiscItemOptions = {
  autoInject: false,
  inputPins: [],
  outputPins: []
};

function isArray(obj: string | string[]): obj is string[] {
  return obj instanceof Array;
}

export function NaiscItem(type: string | string[], opts?: Partial<NaiscItemOptions>): TypeDecorator {
  const options = {...DEFAULT_OPTIONS, ...opts};

  if (!isArray(type)) {
    type = [type];
  }

  type = type.filter((t, i, a) => a.indexOf(t) === i).sort();

  return (target: NaiscType) => {
    if (type.length < 1) {
      throw new Error(`You must specify at least one type '${target.name}'`);
    }

    if (!(target.prototype instanceof NaiscItemContent)) {
      throw new Error(`Decorated class '${target.name}' must extend 'NaiscItemContent' class.`);
    }

    if (options.autoInject) {
      (type as string[]).forEach(t => {
        if (t in AUTO_INJECTED_CONTENTS) {
          const existing = AUTO_INJECTED_CONTENTS[t];

          throw new Error(`Cannot auto-inject '${target.name}' found already '${existing.name}' as provider for type '${t}'`);
        }

        AUTO_INJECTED_CONTENTS[t] = target;
      });
    }

    const metadata = new NaiscMetadata();

    metadata.type = type as string[];
    metadata.factory = () => {
      const descriptor: NaiscItemDescriptor = {
        type: type[0],
        position: Object.seal({x: 0, y: 0}),
        pins: Object.freeze({
          in: options.inputPins.map(p => ({...p})),
          out: options.outputPins.map(p => ({...p}))
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
