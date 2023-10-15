export interface MessagingQueue {
  connect(): Promise<void>;
  sendMessage(
    topic: string,
    message: Record<string, any>,
    queueName?: string,
    options?: Record<string, string>,
  ): Promise<void>;
  receiveMessage(
    topic: string,
    callback: (message: string) => void,
    exchangeName: string,
  ): Promise<void>;
  disconnect(): Promise<void>;
}
