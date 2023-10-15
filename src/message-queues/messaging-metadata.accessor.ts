import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MESSAGING_MODULE_QUEUE,
  MESSAGING_MODULE_QUEUE_PROCESS,
} from './constants';

import { ProcessOptions } from './decorators';

@Injectable()
export class MessagingMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  isQueueComponent(target: Type<any> | Function): boolean {
    if (!target) {
      return false;
    }
    return !!this.reflector.get(MESSAGING_MODULE_QUEUE, target);
  }

  isProcessor(target: Type<any> | Function): boolean {
    if (!target) {
      return false;
    }
    return !!this.reflector.get(MESSAGING_MODULE_QUEUE_PROCESS, target);
  }

  getQueueComponentMetadata(target: Type<any> | Function): any {
    return this.reflector.get(MESSAGING_MODULE_QUEUE, target);
  }

  getProcessMetadata(target: Type<any> | Function): ProcessOptions | undefined {
    return this.reflector.get(MESSAGING_MODULE_QUEUE_PROCESS, target);
  }
}
