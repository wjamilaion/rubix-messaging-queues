import { SetMetadata } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import { MESSAGING_MODULE_QUEUE_PROCESS } from '../constants';

export interface ProcessOptions {
  queueName?: string;
  routingKeys?: string[];
  exchangeName?: string;
}

export function Process(name: string): MethodDecorator;
export function Process(options: ProcessOptions): MethodDecorator;
export function Process(
  nameOrOptions?: string | ProcessOptions,
): MethodDecorator {
  const options = isString(nameOrOptions)
    ? { name: nameOrOptions }
    : nameOrOptions;
  return SetMetadata(MESSAGING_MODULE_QUEUE_PROCESS, options || {});
}
