import { subscriptionConnection } from '../proto/driver';
import { messages } from 'stucco-ts-proto-gen';
import { MessageType } from './message';
import { SubscriptionConnectionInput, SubscriptionConnectionOutput } from '../api';
import { handler } from './handler';

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
