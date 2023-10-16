import { Logger } from '@nestjs/common';
import {
  ProcessCallbackFunction,
  ProcessPromiseFunction,
} from '../messaging.types';
import { toBuffer, toObject } from '../utils';
import { MessagingOptions, MessagingQueue, ProcessOptions } from './../index';
import Bull from 'bull';

export class RedisQueue implements MessagingQueue {
  private readonly logger: Logger = new Logger(RedisQueue.name);

  private redisQueue: Bull.Queue;
  constructor(
    private options: MessagingOptions,
    private redisUri: string,
    private name: string,
  ) {}

  async connect(): Promise<void> {
    this.redisQueue = new Bull(this.name, this.redisUri);
  }

  async sendMessage(
    routingKey: string,
    message: Record<string, any>,
  ): Promise<void> {
    let queue = this.redisQueue;
    if (routingKey !== this.name) {
      queue = new Bull(routingKey, this.redisUri);
    }
    if (!queue) {
      throw new Error('Redis Client is not initialized');
    }
    queue.add(toBuffer(message), {
      timeout: this.options.expirationSeconds * 1000,
    });
    this.logger.log(`Sent: message with routing key: '${routingKey}'`);
  }

  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessCallbackFunction<T>,
  ): Promise<void>;
  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessPromiseFunction<T>,
  ): Promise<void>;
  receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessCallbackFunction<T> | ProcessPromiseFunction<T>,
  ): Promise<void> {
    const { routingKey, name } = options;
    let queue = this.redisQueue;
    if (routingKey !== this.name) {
      queue = new Bull(routingKey, this.redisUri);
    }
    if (!queue) {
      throw new Error('Redis Client is not initialized');
    }
    const call = (job: Bull.Job, done: Bull.DoneCallback) => {
      this.logger.log(`Received: message with routing key: '${routingKey}'`);
      callback(toObject(Buffer.from(job.data.data)), (error, value) => {
        if (error) {
          this.logger.log(
            `Ack: message with routing key: '${routingKey}' with error`,
          );
          return done(error);
        }
        this.logger.log(`Ack: message with routing key: '${routingKey}'`);
        done();
      });
    };
    queue.process.call(queue, call);

    // handle DLQ for failed jobs
    queue.on('failed', error => {
      this.logger.error(error);
      const dlq = new Bull(this.options.deadLetterQueue, this.redisUri);
      dlq.add(error.data.data);
    });
    return;
  }

  async disconnect(): Promise<void> {
    if (this.redisQueue) {
      this.redisQueue.close();
    }
  }
}
