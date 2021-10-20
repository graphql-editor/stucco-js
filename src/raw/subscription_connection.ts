import { subscriptionConnection } from '../proto/driver/index.js';
import * as messages from './../proto/driver/messages.js';
import { MessageType } from './message.js';
import { SubscriptionConnectionInput, SubscriptionConnectionOutput } from '../api/index.js';
import { handler } from './handler.js';

export async function subscriptionConnectionHandler(contentType: string, body: Uint8Array): Promise<Uint8Array> {
  return handler<
    messages.SubscriptionConnectionRequest,
    messages.SubscriptionConnectionResponse,
    SubscriptionConnectionInput,
    SubscriptionConnectionOutput
  >(
    contentType,
    MessageType.SUBSCRIPTION_CONNECTION_REQUEST,
    messages.SubscriptionConnectionRequest,
    messages.SubscriptionConnectionResponse,
    body,
    subscriptionConnection,
  );
}
