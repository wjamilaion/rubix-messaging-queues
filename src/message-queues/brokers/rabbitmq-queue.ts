import { Channel, connect, Connection } from 'amqplib';
import { MessagingQueue } from './../index';
import { Logger } from '@nestjs/common';

export class RabbitMQQueue implements MessagingQueue {
  private readonly logger: Logger = new Logger(RabbitMQQueue.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(
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
      console.error('channel error');
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

    const jsonMessage = JSON.stringify(message);
    this.channel.publish(exchange, routingKey, Buffer.from(jsonMessage));
    this.logger.log(`Sent: '${message}' with routing key: '${routingKey}'`);
  }

  async receiveMessage(
    routingKey: string,
    callback: (message: string) => void,
    exchangeName?: string,
  ): Promise<void> {
    if (!this.channel) {
      await this.connectAndCheck();
    }
    const queueName = this.queueName || '';
    const exchange = this.exchangeName || exchangeName || '';
    await this.channel.assertExchange(exchange, 'topic', { durable: false });
    const q = await this.channel.assertQueue(queueName, { exclusive: true });

    await this.channel.bindQueue(q.queue, exchange, routingKey);

    this.channel.consume(q.queue, msg => {
      if (msg) {
        callback(msg.content.toString());
        this.channel!.ack(msg);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
