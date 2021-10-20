import * as driverService from 'stucco-ts-proto-gen/dist/ts/node/driver_service/service_grpc_pb.cjs';

export interface IDriverService extends driverService.IDriverService {}
export interface IDriverService_IFieldResolve extends driverService.IDriverService_IFieldResolve {}
export interface IDriverService_IInterfaceResolveType extends driverService.IDriverService_IInterfaceResolveType {}
export interface IDriverService_IScalarParse extends driverService.IDriverService_IScalarParse {}
export interface IDriverService_IScalarSerialize extends driverService.IDriverService_IScalarSerialize {}
export interface IDriverService_IUnionResolveType extends driverService.IDriverService_IUnionResolveType {}
export interface IDriverService_ISetSecrets extends driverService.IDriverService_ISetSecrets {}
export interface IDriverService_IStream extends driverService.IDriverService_IStream {}
export interface IDriverService_IStdout extends driverService.IDriverService_IStdout {}
export interface IDriverService_IStderr extends driverService.IDriverService_IStderr {}
export interface IDriverService_ISubscriptionConnection extends driverService.IDriverService_ISubscriptionConnection {}
export interface IDriverService_ISubscriptionListen extends driverService.IDriverService_ISubscriptionListen {}
export interface IDriverServer extends driverService.IDriverServer {}
export interface IDriverClient extends driverService.IDriverClient {}
export class DriverClient extends driverService.DriverClient implements IDriverClient {}
export const DriverService = driverService.DriverService;
