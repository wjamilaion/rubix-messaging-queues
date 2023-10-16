export type AckCallback = (error?: Error | null, value?: any) => void;
export type ProcessCallbackFunction<T> = (
  message: Message<T>,
  done: AckCallback,
) => void;
export type ProcessPromiseFunction<T> = (job: Message<T>) => Promise<void>;

export interface Message<T> {
  content: T;
  properties: MessageProperties;
}

export interface MessageProperties {
  // contentType: any | undefined;
  // contentEncoding: any | undefined;
  // headers: MessagePropertyHeaders;
  deliveryMode: any | undefined;
  priority: any | undefined;
  correlationId: any | undefined;
  replyTo: any | undefined;
  expiration: any | undefined;
  messageId: any | undefined;
  timestamp: any | undefined;
  type: any | undefined;
  userId: any | undefined;
  appId: any | undefined;
  clusterId: any | undefined;
}
