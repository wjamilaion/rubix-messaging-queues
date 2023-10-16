import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
  createContextId,
} from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MessagingMetadataAccessor } from './messaging-metadata.accessor';
import { MessagingService } from './service/messaging.service';
import { ProcessOptions } from './decorators';
import { Module } from '@nestjs/core/injector/module';
import { Injector } from '@nestjs/core/injector/injector';

@Injectable()
export class MessageExplorer implements OnModuleInit {
  private readonly logger = new Logger(MessageExplorer.name);
  private readonly injector = new Injector();

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
    return this._explore(providers);
  }

  private _explore(providers: InstanceWrapper[]) {
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance, metatype } = wrapper;
      const isRequestScoped = !wrapper.isDependencyTreeStatic();
      const { name: queueName } =
        this.metadataAccessor.getQueueComponentMetadata(
          // NOTE: We are relying on `instance.constructor` to properly support
          // `useValue` and `useFactory` providers besides `useClass`.
          instance.constructor || metatype,
        );

      // const queueToken = getQueueToken(queueName);
      // const bullQueue = this.getQueue(queueToken, queueName);

      this.metadataScanner
        .getAllMethodNames(instance)
        .forEach((key: string) => {
          if (this.metadataAccessor.isProcessor(instance[key])) {
            const metadata = this.metadataAccessor.getProcessMetadata(
              instance[key],
            );
            this.handleProcessor(
              instance,
              key,
              // bullQueue,
              wrapper.host,
              isRequestScoped,
              metadata,
            );
          }
        });
    });
  }

  handleProcessor(
    instance: object,
    key: string,
    // queue: Queue,
    moduleRef: Module,
    isRequestScoped: boolean,
    options?: ProcessOptions,
  ) {
    let call;
    if (isRequestScoped) {
      const callback = async (...args: unknown[]) => {
        const contextId = createContextId();

        if (this.moduleRef.registerRequestByContextId) {
          // Additional condition to prevent breaking changes in
          // applications that use @nestjs/bull older than v7.4.0.
          const jobRef = args[0];
          this.moduleRef.registerRequestByContextId(jobRef, contextId);
        }

        const contextInstance = await this.injector.loadPerContext(
          instance,
          moduleRef,
          moduleRef.providers,
          contextId,
        );
        return contextInstance[key].call(contextInstance, ...args);
      };
      call = callback;
    } else {
      call = instance[key].bind(instance);
    }
    const service = this.moduleRef.get(MessagingService, { strict: false });
    this.logger.log(`subscribing to routing key ( ${options.routingKey} )`);
    service.receiveMessage(options, call);
  }
}
