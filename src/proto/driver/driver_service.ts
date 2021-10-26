import { driverService } from 'stucco-ts-proto-gen';

export type IDriverService = driverService.IDriverService;
export type IDriverService_IFieldResolve = driverService.IDriverService_IFieldResolve;
export type IDriverService_IInterfaceResolveType = driverService.IDriverService_IInterfaceResolveType;
export type IDriverService_IScalarParse = driverService.IDriverService_IScalarParse;
export type IDriverService_IScalarSerialize = driverService.IDriverService_IScalarSerialize;
export type IDriverService_IUnionResolveType = driverService.IDriverService_IUnionResolveType;
export type IDriverService_ISetSecrets = driverService.IDriverService_ISetSecrets;
export type IDriverService_IStream = driverService.IDriverService_IStream;
export type IDriverService_IStdout = driverService.IDriverService_IStdout;
export type IDriverService_IStderr = driverService.IDriverService_IStderr;
export type IDriverService_ISubscriptionConnection = driverService.IDriverService_ISubscriptionConnection;
export type IDriverService_ISubscriptionListen = driverService.IDriverService_ISubscriptionListen;
export type IDriverServer = driverService.IDriverServer;
export type IDriverClient = driverService.IDriverClient;
export class DriverClient extends driverService.DriverClient implements IDriverClient {}
export const DriverService = driverService.DriverService;
