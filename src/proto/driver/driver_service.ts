import { driverService } from 'stucco-ts-proto-gen';

export type IDriverService = typeof driverService.DriverService;
export type IDriverService_IFieldResolve = IDriverService['fieldResolve'];
export type IDriverService_IInterfaceResolveType = IDriverService['interfaceResolveType'];
export type IDriverService_IScalarParse = IDriverService['scalarParse'];
export type IDriverService_IScalarSerialize = IDriverService['scalarSerialize'];
export type IDriverService_IUnionResolveType = IDriverService['unionResolveType'];
export type IDriverService_ISetSecrets = IDriverService['setSecrets'];
export type IDriverService_IStream = IDriverService['stream'];
export type IDriverService_IStdout = IDriverService['stdout'];
export type IDriverService_IStderr = IDriverService['stderr'];
export type IDriverService_ISubscriptionConnection = IDriverService['subscriptionConnection'];
export type IDriverService_ISubscriptionListen = IDriverService['subscriptionListen'];

export class DriverClient extends driverService.DriverClient {}
export type IDriverServer = driverService.IDriverServer;
export type IDriverClient = driverService.IDriverClient;
export const DriverService = driverService.DriverService;
