import {
  Injectable,
  Inject,
  NotImplementedException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  BROKER_TYPE,
  MESSAGING_MODULE_OPTIONS,
  MESSAGING_OPTIONS,
  MessagingQueue,
} from '../';
import { MessagingOptions } from '..';
import { RabbitMQQueue } from '../brokers';
// import { RedisQueue } from '../brokers/redis-queue';
@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  // constructor(private readonly messagingService: MessagingService) {}
  async onModuleDestroy() {
    // await this.disconnect();
  }

  async onModuleInit() {
    // await this.connect();
  }

  private messagingQueue: MessagingQueue;

  constructor(
    @Inject(MESSAGING_MODULE_OPTIONS) readonly options: MessagingOptions,
    queueName?: string,
    exchangeName?: string,
    // options: Record<string, string>
  ) {
    // Initialize the messaging queue based on the provided options
    if (options.brokerType === BROKER_TYPE.rabbitMQ) {
      this.messagingQueue = new RabbitMQQueue(
        options.rabbitmq,
        queueName,
        exchangeName,
      );
    } else if (options.brokerType === BROKER_TYPE.ibmmq) {
      throw new NotImplementedException();
    } else if (options.brokerType === BROKER_TYPE.redis) {
      throw new NotImplementedException();
      // this.messagingQueue = new RedisQueue(options.redis, queueName);
    } else {
      throw new Error('Invalid broker type');
    }
    console.log('channel');
    this.connect();
  }

  async connect(): Promise<void> {
    await this.messagingQueue.connect();
  }

  async sendMessage(
    routingKey: string,
    message: Record<string, any>,
  ): Promise<void> {
    await this.messagingQueue.sendMessage(routingKey, message);
  }

  async receiveMessage(
    routingKey: string,
    callback: (message: string) => void,
    exchange: string,
  ): Promise<void> {
    await this.messagingQueue.receiveMessage(routingKey, callback, exchange);
  }

  async disconnect(): Promise<void> {
    await this.messagingQueue.disconnect();
  }
}
