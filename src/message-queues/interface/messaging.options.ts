import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export enum BROKER_TYPE {
  rabbitMQ = 'rabbitMQ',
  ibmmq = 'ibmmq',
  redis = 'redis',
}

export interface MessagingOptions {
  expirationSeconds?: number;
  deadLetterExchange: string;
  deadLetterQueue: string;
  /**
   * brokerType could be rabbitmq, redis
   */
  brokerType: BROKER_TYPE;

  /**
   * if broker type id rabbitmq then provide configurations to connect rabbitmq
   */
  rabbitmq?: any;
  redis?: any;
}
export interface MessagingOptionsFactory {
  createMessagingOptions(): Promise<MessagingOptions> | MessagingOptions;
}
export interface MessagingOptionsAsync extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MessagingOptionsFactory>;
  useClass?: Type<MessagingOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<MessagingOptions> | MessagingOptions;
  inject?: any[];
}

export const MESSAGING_OPTIONS = 'MESSAGING_OPTION';
export const MESSAGING_MODULE_OPTIONS = 'MESSAGING_MODULE_OPTION';
