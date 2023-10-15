// import { MessagingQueue } from './../index';
// import * as Bull from 'bull';
// import { InjectQueue } from '@nestjs/bull';
// import { NotImplementedException } from '@nestjs/common';

// export class RedisQueue implements MessagingQueue {

//     private redisQueue: Bull.Queue;
//     constructor(
//         private redisUri: string,
//         private name: string
//     ) { }

//     async connect(): Promise<void> {
//         this.redisQueue = new Bull(this.name, this.redisUri);
//     }

//     async sendMessage(routingKey: string, message: Record<string, any>): Promise<void> {
//         if (!this.redisQueue) {
//             throw new Error('Redis Client is not initialized');
//         }
//         this.redisQueue.add(message);
//     }

//     async receiveMessage(routingKey: string, callback: (message: string) => void): Promise<void> {
//         throw new NotImplementedException();
//     }

//     async disconnect(): Promise<void> {
//         if (this.redisQueue) {
//             this.redisQueue.close();
//         }
//     }
// }
