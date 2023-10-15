import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  MESSAGING_OPTIONS,
  MESSAGING_MODULE_OPTIONS,
  MessagingOptions,
  MessagingOptionsAsync,
  MessagingService,
  MessagingOptionsFactory,
} from './';
import { MessageExplorer } from './messaging.explorer';
import { MessagingMetadataAccessor } from './messaging-metadata.accessor';
import { DiscoveryModule } from '@nestjs/core';

@Module({})
export class MessagingModule {
  private static registerCore() {
    return {
      global: true,
      module: MessagingModule,
      imports: [DiscoveryModule],
      providers: [MessageExplorer, MessagingMetadataAccessor],
    };
  }

  static registerQueue(options: {
    name: string;
    exchangeName: string;
  }): DynamicModule {
    const { name, exchangeName } = options;
    const queueProvider: Provider = {
      provide: MessagingService,
      useFactory: (options: MessagingOptions) => {
        return new MessagingService(options, name, exchangeName);
      },
      inject: [MESSAGING_OPTIONS],
    };

    return {
      imports: [MessagingModule.registerCore()],
      module: MessagingModule,
      providers: [queueProvider],
      exports: [queueProvider],
    };
  }

  static forRoot(options: MessagingOptions): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        {
          provide: MESSAGING_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: MessagingOptionsAsync): DynamicModule {
    const messagingBroker = {
      provide: MESSAGING_OPTIONS,
      useFactory: (messagingOptions: MessagingOptions) => {
        return messagingOptions;
      },
      inject: [MESSAGING_MODULE_OPTIONS],
    };
    return {
      global: true,
      module: MessagingModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), messagingBroker],
      exports: [messagingBroker],
    };
  }

  private static createAsyncProviders(
    options: MessagingOptionsAsync,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<MessagingOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: MessagingOptionsAsync,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: MESSAGING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<TypeOrmOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass ||
        options.useExisting) as Type<MessagingOptionsFactory>,
    ];
    return {
      provide: MESSAGING_MODULE_OPTIONS,
      useFactory: async (optionsFactory: MessagingOptionsFactory) =>
        await optionsFactory.createMessagingOptions(),
      inject,
    };
  }
}
