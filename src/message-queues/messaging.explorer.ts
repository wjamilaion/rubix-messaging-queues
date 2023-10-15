import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MessagingMetadataAccessor } from './messaging-metadata.accessor';
import { MessagingService } from './service/messaging.service';
import { ProcessOptions } from './decorators';

@Injectable()
export class MessageExplorer implements OnModuleInit {
  private readonly logger = new Logger(MessageExplorer.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: MessagingMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    const subscribers = this.exploreProviders();
  }

  exploreProviders() {
    const providers: InstanceWrapper[] = this.discoveryService
      .getProviders()
      .filter((wrapper: InstanceWrapper) =>
        this.metadataAccessor.isQueueComponent(
          // NOTE: Regarding the ternary statement below,
          // - The condition `!wrapper.metatype` is because when we use `useValue`
          // the value of `wrapper.metatype` will be `null`.
          // - The condition `wrapper.inject` is needed here because when we use
          // `useFactory`, the value of `wrapper.metatype` will be the supplied
          // factory function.
          // For both cases, we should use `wrapper.instance.constructor` instead
          // of `wrapper.metatype` to resolve processor's class properly.
          // But since calling `wrapper.instance` could degrade overall performance
          // we must defer it as much we can. But there's no other way to grab the
          // right class that could be annotated with `@Processor()` decorator
          // without using this property.
          !wrapper.metatype || wrapper.inject
            ? wrapper.instance?.constructor
            : wrapper.metatype,
        ),
      );
    return this.explore(providers);
  }

  private explore(instanceWrappers: InstanceWrapper[]) {
    for (const wrapper of instanceWrappers) {
      const { instance } = wrapper;
      this.metadataScanner.getAllMethodNames(instance).forEach(method => {
        if (this.metadataAccessor.isProcessor(instance[method])) {
          const metadata = this.metadataAccessor.getProcessMetadata(
            instance[method],
          );
          this.setupSubscribers(metadata, instance, method);
        }
      });
    }
  }
  async setupSubscribers(
    options: ProcessOptions,
    instance: Object,
    method: string,
  ) {
    const service = this.moduleRef.get(MessagingService, { strict: false });
    options.routingKeys.map(routingKey => {
      this.logger.log(`subscribing to routing key ( ${routingKey} )`);
      service.receiveMessage(
        routingKey,
        instance[method],
        options.exchangeName,
      );
    });
  }
}
