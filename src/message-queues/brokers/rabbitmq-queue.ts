import { Channel, connect, Connection } from 'amqplib';
import { MessagingOptions, MessagingQueue, ProcessOptions } from './../index';
import { Logger } from '@nestjs/common';
import { toBuffer, toObject } from '../utils';
import {
  ProcessCallbackFunction,
  ProcessPromiseFunction,
} from '../messaging.types';

export class RabbitMQQueue implements MessagingQueue {
  private readonly logger: Logger = new Logger(RabbitMQQueue.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(
    private options: MessagingOptions,
    private config: string,
    private queueName: string,
    private exchangeName: string,
    private durable?: boolean,
  ) {}

  async connect(): Promise<void> {
    this.connection = await connect(this.config);
    this.channel = await this.connection.createChannel();
  }
  async connectAndCheck(): Promise<void> {
    await this.connect();
    if (!this.channel) {
      this.logger.error('channel error');
      throw new Error('Channel is not open');
    }
  }

  async sendMessage(
    routingKey: string,
    message: Record<string, any>,
    exchangeName?: string,
  ): Promise<void> {
    if (!this.channel) {
      await this.connectAndCheck();
    }

    const exchange = this.exchangeName || exchangeName || '';

    // topic based
    await this.channel.assertExchange(exchange, 'topic', { durable: false });

    this.channel.publish(exchange, routingKey, toBuffer(message), {
      expiration: this.options.expirationSeconds * 1000,
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
  async receiveMessage<T>(
    options: ProcessOptions,
    callback: ProcessCallbackFunction<T> | ProcessPromiseFunction<T>,
  ): Promise<void> {
    if (!this.channel) {
      await this.connectAndCheck();
    }
    const { exchangeName, routingKey } = options;
    const queueName = this.queueName || '';
    const exchange = this.exchangeName || exchangeName || '';

    // setup dead letter queue
    const { deadLetterExchange, deadLetterQueue } = this.options;
    await this.setupDeadLetterQueue(deadLetterExchange, deadLetterQueue);

    await this.channel.assertExchange(exchange, 'topic', { durable: false });
    const q = await this.channel.assertQueue(queueName, {
      exclusive: false,
      arguments: {
        'x-dead-letter-exchange': deadLetterExchange,
        'x-dead-letter-routing-key': deadLetterQueue,
      },
    });

    await this.channel.bindQueue(q.queue, exchange, routingKey);

    this.channel.consume(q.queue, msg => {
      if (msg) {
        this.logger.log(`Received: message with routing key: '${routingKey}'`);
        callback(toObject(msg.content), (error, value) => {
          if (error) {
            this.logger.log(
              `Ack: message with routing key: '${routingKey}' with error`,
            );
            return this.channel!.nack(msg);
          }
          this.logger.log(`Ack: message with routing key: '${routingKey}'`);
          this.channel!.ack(msg);
        });
      }
    });
  }
  private async setupDeadLetterQueue(
    dead_letter_exchange: string,
    dead_letter_queue: string,
  ) {
    // Declare the dead letter exchange
    await this.channel.assertExchange(dead_letter_exchange, 'fanout', {
      durable: true,
    });

    // Declare the dead letter queue
    await this.channel.assertQueue(dead_letter_queue, { durable: true });

    // Bind the dead letter queue to the dead letter exchange
    await this.channel.bindQueue(dead_letter_queue, dead_letter_exchange, '');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
