import { ProcessOptions } from '..';
import {
  ProcessCallbackFunction,
  ProcessPromiseFunction,
} from '../messaging.types';

export interface MessagingQueue {
  connect(): Promise<void>;
  sendMessage(
    topic: string,
    message: Record<string, any>,
    exchangeName?: string,
  ): Promise<void>;

  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessCallbackFunction<T>,
    exchangeName: string,
  ): Promise<void>;
  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessPromiseFunction<T>,
  ): Promise<void>;
  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessCallbackFunction<T> | ProcessPromiseFunction<T>,
  ): Promise<void>;
  disconnect(): Promise<void>;
}
