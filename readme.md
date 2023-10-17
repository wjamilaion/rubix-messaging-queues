
# NestJS Messaging Module

This is an npm package for managing messaging in NestJS applications. It provides a way to configure messaging options and send messages from different services in your NestJS application.


## Installation


You can install this package using npm or yarn:

```bash
npm install @aiondigital/messaging-queues
# or
yarn add @aiondigital/messaging-queues
```
    
## Usage/Examples

To configure the module globally, you can use the `MessagingModule.forRootAsync` method. This allows you to set up the messaging options for your application.

```
import { MessagingModule } from '@your-namespace/nestjs-messaging';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [CommonModule],
  imports: [
    MessagingModule.forRootAsync({
      useFactory: (_config: ConfigurationService) => {
        return _config.MESSAGING_OPTIONS;
      },
      inject: [ConfigurationService],
    }),
  ],
})
export class YourModule {}

```
The `MESSAGING_OPTIONS` object should have the following fields:

- expirationSeconds (optional): A number specifying message expiration time.
- deadLetterExchange: The name of the dead-letter exchange.
- deadLetterQueue: The name of the dead-letter queue.
- brokerType: A value representing the broker type (e.g., "redis" or "rabbitmq").
- rabbitmq (optional): Additional configuration for RabbitMQ, if brokerType is set to "rabbitmq".
- redis (optional): Additional configuration for Redis, if brokerType is set to "redis".

## Sending Messages
You can send messages from different services in your NestJS application using the MessagingService. First, you need to register a queue:

```
import { MessagingModule } from '@your-namespace/nestjs-messaging';

@Module({
  imports: [MessagingModule.registerQueue({
    name: ROUTING_KEYS.ADD_AUDIT_LOG,
    exchangeName: EXCHANGE.AUDIT,
  })],
})
export class YourModule {}

```

Then, in your service, you can use the `MessagingService` to send messages:

```
import { Injectable } from '@nestjs/common';
import { MessagingService } from '@your-namespace/nestjs-messaging';

@Injectable()
export class YourService {
  constructor(private readonly messagingService: MessagingService) {}

  sendLogs(input) {
    this.messagingService.sendMessage(ROUTING_KEYS.ADD_AUDIT_LOG, input);
  }
}

```

That's it! You've now set up global configuration for the messaging module and can use the `MessagingService` to send messages from your NestJS services.

## Message Processing

### Class-Level Decorator
At the class level, you can use the @Processor decorator to specify which routing key this class will be responsible for processing. Here's how you can use it:

```
import { Processor } from '@your-namespace/nestjs-messaging';

@Processor(ROUTING_KEYS.ADD_AUDIT_LOG)
export class YourMessageProcessor {
  // Your message processing methods go here
}

```

### Function-Level Decorator

For individual message processing methods, you can use the `@Process` decorator to specify the details of the message processing. Here's how you can use it:

```
import { Process } from '@your-namespace/nestjs-messaging';
import { CreateAuditLogInput } from './create-audit-log.dto';

@Process({
  name: '', // Give it a unique name
  exchangeName: EXCHANGE.AUDIT,
  routingKey: ROUTING_KEYS.ADD_AUDIT_LOG,
})
async auditlog(data: CreateAuditLogInput, done: AckCallback) {
  // Your message processing logic here
  try {
    const audit = await this.auditService.create(data, ['id']);
    return audit;
  } catch (error) {
    this.#logger.error(`Failed to add audit log: [${JSON.stringify(data)}]`);
    this.#logger.error(error);
    done(error);
  }
}
```

You should place the `@Process` decorator on methods that will process messages with a specific routing key. You can have multiple methods with different routing keys within the same class.

Remember to replace the placeholders (`ROUTING_KEYS.ADD_AUDIT_LOG`, `EXCHANGE.AUDIT`, etc.)` with the actual values from your application.

Now, the `YourMessageProcessor` class will process messages with the routing key specified in the `@Processor` decorator, and the `auditlog` method will handle messages with the routing key specified in the `@Process` decorator.


## License

This package is released under the [MIT License](https://choosealicense.com/licenses/mit/) 

