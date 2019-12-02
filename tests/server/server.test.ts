import * as jspb from 'google-protobuf';
import grpc, { ServerUnaryCall } from 'grpc';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import { Writable } from 'stream';
import {
  FieldResolveInput,
  FieldResolveOutput,
  InterfaceResolveTypeOutput,
  InterfaceResolveTypeInput,
  ScalarParseOutput,
  ScalarParseInput,
  ScalarSerializeOutput,
  ScalarSerializeInput,
  UnionResolveTypeOutput,
  UnionResolveTypeInput,
} from '../../src/api';
import { DriverService } from '../../src/proto/driver_grpc_pb';
import {
  ArrayValue,
  Directive,
  Error as DriverError,
  FieldResolveRequest,
  FieldResolveResponse,
  FragmentDefinition,
  InterfaceResolveTypeRequest,
  InterfaceResolveTypeResponse,
  ObjectValue,
  OperationDefinition,
  ResponsePath,
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
  Selection,
  TypeRef,
  UnionResolveTypeRequest,
  UnionResolveTypeResponse,
  Value,
  Variable,
  VariableDefinition,
  ByteStream,
} from '../../src/proto/driver_pb';
import { Server } from '../../src/server/server';

describe('grpc server', () => {
  const server = {
    addService: jest.fn(),
    bind: jest.fn(),
    start: jest.fn(),
    tryShutdown: jest.fn(),
  };
  it('adds services', () => {
    new Server({ server });
    expect(server.addService).toBeCalledWith(
      HealthService,
      new GrpcHealthCheck({
        plugin: HealthCheckResponse.ServingStatus.SERVING,
      }),
    );
    expect(server.addService).toBeCalledWith(
      DriverService,
      expect.objectContaining({
        fieldResolve: expect.anything(),
        interfaceResolveType: expect.anything(),
        scalarParse: expect.anything(),
        scalarSerialize: expect.anything(),
        unionResolveType: expect.anything(),
      }),
    );
    expect(server.addService).toBeCalledTimes(2);
  });
  describe('resolves field', () => {
    const newImplementation = (f: () => FieldResolveOutput): jest.Mock<FieldResolveOutput, [FieldResolveInput]> => {
      return jest.fn<FieldResolveOutput, [FieldResolveInput]>(f);
    };
    afterEach(() => {
      jest.resetModules();
    });
    const epxectedFieldResponse = new FieldResolveResponse();
    const v = new Value();
    v.setS('test response');
    epxectedFieldResponse.setResponse(v);
    const data: Array<{
      title: string;
      functionName: string;
      expectedFunctionName?: string;
      expectedImport: string;
      implementation: jest.Mock<FieldResolveOutput, [FieldResolveInput]>;
      implementationCalledWith: FieldResolveInput;
      inputArguments?: Array<[string, Value]>;
      inputSource?: Value;
      inputProtocol?: Value;
      inputPath?: ResponsePath;
      inputReturntype?: TypeRef;
      inputVariablevalues?: Array<[string, Value]>;
      inputOperation?: OperationDefinition;
      inputParentType?: TypeRef;
      expected: FieldResolveResponse;
    }> = [
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation((): unknown => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'without function name and function export',
      },
      {
        expected: epxectedFieldResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation((): unknown => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'without function name and with handler export',
      },
      {
        expected: epxectedFieldResponse,
        expectedFunctionName: 'name',
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName.name',
        implementation: newImplementation((): unknown => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'with function name',
      },
      {
        expected: epxectedFieldResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'resolveFieldName.js',
        functionName: 'resolveFieldName.js',
        implementation: newImplementation((): unknown => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'default handler for .js extension',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => (): unknown => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'resolve field from function',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation((): unknown => ({ response: 'test response' })),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'resolve field from type object',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation((): unknown => ({ response: (): unknown => 'test response' })),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'resolve field from type object with function',
      },
      {
        expected: ((): FieldResolveResponse => {
          const expectedResponse = new FieldResolveResponse();
          expectedResponse.setResponse(new Value());
          return expectedResponse;
        })(),
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => undefined),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'resolve field from undefined',
      },
      {
        expected: ((): FieldResolveResponse => {
          const errorResponse = new FieldResolveResponse();
          const error = new DriverError();
          error.setMsg('test error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => {
          throw new Error('test error');
        }),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'throwing error',
      },
      {
        expected: ((): FieldResolveResponse => {
          const errorResponse = new FieldResolveResponse();
          const error = new DriverError();
          error.setMsg('unknown error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => {
          throw {};
        }),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'throwing bad error',
      },
      {
        expected: ((): FieldResolveResponse => {
          const errorResponse = new FieldResolveResponse();
          const error = new DriverError();
          error.setMsg('unknown error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => ({ error: {} })),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'handling error property',
      },
      {
        expected: ((): FieldResolveResponse => {
          const errorResponse = new FieldResolveResponse();
          const error = new DriverError();
          error.setMsg('user error value');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => ({
          error: {
            message: 'user error value',
          },
        })),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        title: 'handle user error not thrown',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          arguments: {
            arg: 'value',
          },
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
          protocol: {
            headers: {
              HTTP_HEADER: ['value'],
            },
          },
          source: 'some source',
        },
        inputArguments: ((): Array<[string, Value]> => {
          const argVal = new Value();
          argVal.setS('value');
          const args = new Array<[string, Value]>();
          args.push(['arg', argVal]);
          return args;
        })(),
        inputProtocol: ((): Value => {
          const value = new Value();
          value.setS('value');
          const httpHeaderArray = new ArrayValue();
          httpHeaderArray.addItems(value);
          const httpHeader = new Value();
          httpHeader.setA(httpHeaderArray);
          const headerObject = new ObjectValue();
          headerObject.getPropsMap().set('HTTP_HEADER', httpHeader);
          const headerValue = new Value();
          headerValue.setO(headerObject);
          const protocolObject = new ObjectValue();
          protocolObject.getPropsMap().set('headers', headerValue);
          const protocol = new Value();
          protocol.setO(protocolObject);
          return protocol;
        })(),
        inputSource: ((): Value => {
          const source = new Value();
          source.setS('some source');
          return source;
        })(),
        title: 'with protocol and headers',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        inputProtocol: ((): Value => {
          const protocol = new Value();
          protocol.setO(new ObjectValue());
          return protocol;
        })(),
        title: 'ignore protocol without headers',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        inputProtocol: ((): Value => {
          const protocol = new Value();
          return protocol;
        })(),
        title: 'ignore null protocol',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        inputProtocol: ((): Value => {
          const protocolObject = new ObjectValue();
          protocolObject.getPropsMap().set('headers', new Value());
          const protocol = new Value();
          protocol.setO(protocolObject);
          return protocol;
        })(),
        title: 'ignore bad headers',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
          },
        },
        inputProtocol: ((): Value => {
          const headerObject = new ObjectValue();
          headerObject.getPropsMap().set('someBadHeader', new Value());
          const headerValue = new Value();
          headerValue.setO(headerObject);
          const protocolObject = new ObjectValue();
          protocolObject.getPropsMap().set('headers', headerValue);
          const protocol = new Value();
          protocol.setO(protocolObject);
          return protocol;
        })(),
        title: 'headers in protocol must be a map of string arrays',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            path: {
              key: 'sub',
              prev: {
                key: 'root',
              },
            },
            returnType: {
              name: 'String',
            },
          },
        },
        inputPath: ((): ResponsePath => {
          const rp = new ResponsePath();
          rp.setKey('sub');
          const prev = new ResponsePath();
          prev.setKey('root');
          rp.setPrev(prev);
          return rp;
        })(),
        title: 'with resolve path',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              list: {
                nonNull: {
                  name: 'String',
                },
              },
            },
          },
        },
        inputReturntype: ((): TypeRef => {
          const rt = new TypeRef();
          const nonNull = new TypeRef();
          rt.setList(nonNull);
          const stringType = new TypeRef();
          nonNull.setNonnull(stringType);
          stringType.setName('String');
          return rt;
        })(),
        title: 'with return type',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            returnType: {
              name: 'String',
            },
            variableValues: {
              var: 'value',
            },
          },
        },
        inputVariablevalues: ((): Array<[string, Value]> => {
          const value = new Value();
          value.setS('value');
          const arr = new Array<[string, Value]>();
          arr.push(['var', value]);
          return arr;
        })(),
        title: 'with variable values',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            operation: {
              directives: [
                {
                  arguments: {
                    arg: 'value',
                  },
                  name: '@somedir',
                },
              ],
              name: 'someop',
              operation: 'query',
              selectionSet: [
                {
                  arguments: {
                    arg: 'value',
                  },
                  directives: [
                    {
                      arguments: {
                        arg: 'value',
                      },
                      name: '@somedir',
                    },
                  ],
                  name: 'field',
                  selectionSet: [
                    {
                      arguments: {
                        arg: 'value',
                      },
                      directives: [
                        {
                          arguments: {
                            arg: 'value',
                          },
                          name: '@somedir',
                        },
                      ],
                      name: 'field',
                    },
                    {
                      definition: {
                        directives: [
                          {
                            arguments: {
                              arg: 'value',
                            },
                            name: '@somedir',
                          },
                        ],
                        selectionSet: [
                          {
                            arguments: {
                              arg: 'value',
                            },
                            directives: [
                              {
                                arguments: {
                                  arg: 'value',
                                },
                                name: '@somedir',
                              },
                            ],
                            name: 'field',
                          },
                        ],
                        typeCondition: {
                          name: 'SomeType',
                        },
                        variableDefinitions: [
                          {
                            defaultValue: 'value',
                            variable: {
                              name: 'var',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  definition: {
                    directives: [
                      {
                        arguments: {
                          arg: 'value',
                        },
                        name: '@somedir',
                      },
                    ],
                    selectionSet: [
                      {
                        arguments: {
                          arg: 'value',
                        },
                        directives: [
                          {
                            arguments: {
                              arg: 'value',
                            },
                            name: '@somedir',
                          },
                        ],
                        name: 'field',
                      },
                    ],
                    typeCondition: {
                      name: 'SomeType',
                    },
                    variableDefinitions: [
                      {
                        defaultValue: 'value',
                        variable: {
                          name: 'var',
                        },
                      },
                    ],
                  },
                },
              ],
              variableDefinitions: [
                {
                  defaultValue: 'value',
                  variable: {
                    name: 'var',
                  },
                },
              ],
            },
            returnType: {
              name: 'String',
            },
          },
        },
        inputOperation: ((): OperationDefinition => {
          const op = new OperationDefinition();
          op.setOperation('query');
          op.setName('someop');
          const variableDefinition = new VariableDefinition();
          const badVariableDefinition = new VariableDefinition();
          const defaultValue = new Value();
          defaultValue.setS('value');
          const variable = new Variable();
          variable.setName('var');
          variableDefinition.setDefaultvalue(defaultValue);
          variableDefinition.setVariable(variable);
          op.setVariabledefinitionsList([variableDefinition, badVariableDefinition]);
          const directive = new Directive();
          directive.setName('@somedir');
          const argValue = new Value();
          argValue.setS('value');
          directive.getArgumentsMap().set('arg', argValue);
          op.setDirectivesList([directive]);
          const fieldSelection = new Selection();
          fieldSelection.setName('field');
          fieldSelection.getArgumentsMap().set('arg', argValue);
          fieldSelection.setDirectivesList([directive]);
          const fragmentSelection = new Selection();
          const fragmentDefinition = new FragmentDefinition();
          fragmentDefinition.setDirectivesList([directive]);
          fragmentDefinition.setVariabledefinitionsList([variableDefinition]);
          const someTypeRef = new TypeRef();
          someTypeRef.setName('SomeType');
          fragmentDefinition.setTypecondition(someTypeRef);
          fragmentDefinition.setSelectionsetList([fieldSelection]);
          const rootFieldSelection = new Selection();
          rootFieldSelection.setName('field');
          rootFieldSelection.getArgumentsMap().set('arg', argValue);
          rootFieldSelection.setDirectivesList([directive]);
          rootFieldSelection.setSelectionsetList([fieldSelection, fragmentSelection]);
          fragmentSelection.setDefinition(fragmentDefinition);
          op.setSelectionsetList([rootFieldSelection, fragmentSelection]);
          return op;
        })(),
        title: 'with operation',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            operation: undefined,
            returnType: {
              name: 'String',
            },
          },
        },
        inputOperation: undefined,
        title: 'with undefined operation',
      },
      {
        expected: epxectedFieldResponse,
        expectedImport: 'resolveFieldName',
        functionName: 'resolveFieldName',
        implementation: newImplementation(() => 'test response'),
        implementationCalledWith: {
          info: {
            fieldName: 'field',
            parentType: {
              name: 'String',
            },
            returnType: {
              name: 'String',
            },
          },
        },
        inputParentType: ((): TypeRef => {
          const pt = new TypeRef();
          pt.setName('String');
          return pt;
        })(),
        title: 'with parent type',
      },
    ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module:
              | ((input: FieldResolveInput) => unknown)
              | { [k: string]: (input: FieldResolveInput) => unknown };
            if (d.expectedFunctionName) {
              module = {};
              module[d.expectedFunctionName] = d.implementation;
            } else {
              module = d.implementation;
            }
            return module;
          },
          { virtual: true },
        );
        const info = {
          getFieldname: jest.fn(() => 'field'),
          getOperation: jest.fn(() => d.inputOperation),
          getParenttype: jest.fn(() => d.inputParentType),
          getPath: jest.fn(() => d.inputPath),
          getReturntype: jest.fn(() => d.inputReturntype || { getName: jest.fn(() => 'String') }),
          getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>(d.inputVariablevalues || [])),
          hasOperation: jest.fn(() => 'inputOperation' in d),
          hasParenttype: jest.fn(() => !!d.inputParentType),
          hasPath: jest.fn(() => !!d.inputPath),
        };
        const call = {
          request: {
            getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>(d.inputArguments || [])),
            getFunction: jest.fn(() => ({
              getName: jest.fn(() => d.functionName),
            })),
            getInfo: jest.fn(() => info),
            getProtocol: jest.fn(() => d.inputProtocol),
            getSource: jest.fn(() => d.inputSource),
            hasFunction: jest.fn(() => true),
            hasProtocol: jest.fn(() => !!d.inputProtocol),
            hasSource: jest.fn(() => !!d.inputSource),
          },
        };
        const unary = (call as unknown) as ServerUnaryCall<FieldResolveRequest>;
        const srv = new Server({ server });
        const cb = jest.fn();
        await srv.fieldResolve(unary, cb);
        expect(call.request.hasFunction).toBeCalledTimes(1);
        expect(call.request.getFunction).toBeCalledTimes(1);
        expect(call.request.hasSource).toBeCalledTimes(1);
        expect(call.request.getInfo).toBeCalledTimes(1);
        expect(call.request.getArgumentsMap).toBeCalledTimes(1);
        expect(call.request.hasProtocol).toBeCalledTimes(1);
        expect(info.getFieldname).toBeCalledTimes(1);
        expect(info.hasOperation).toBeCalledTimes(1);
        expect(info.getVariablevaluesMap).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(null, d.expected);
        expect(d.implementation).toHaveBeenCalledWith(d.implementationCalledWith);
      });
    });
  });
  describe('resolves interface type', () => {
    const newImplementation = (
      f: () => InterfaceResolveTypeOutput,
    ): jest.Mock<InterfaceResolveTypeOutput, [InterfaceResolveTypeInput]> => {
      return jest.fn<InterfaceResolveTypeOutput, [InterfaceResolveTypeInput]>(f);
    };
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new InterfaceResolveTypeResponse();
    const t = new TypeRef();
    t.setName('String');
    expectedResponse.setType(t);
    const data: Array<{
      title: string;
      functionName: string;
      expectedFunctionName?: string;
      expectedImport: string;
      implementation: jest.Mock<InterfaceResolveTypeOutput, [InterfaceResolveTypeInput]>;
      expected: InterfaceResolveTypeResponse;
    }> = [
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): string => 'String'),
        title: 'without function name and function export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): string => 'String'),
        title: 'without function name and with handler export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'name',
        expectedImport: 'resolveType',
        functionName: 'resolveType.name',
        implementation: newImplementation((): string => 'String'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation(() => (): string => 'String'),
        title: 'resolve type from function',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): { type: string } => ({ type: 'String' })),
        title: 'resolve type from type object',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): { type: () => string } => ({ type: (): string => 'String' })),
        title: 'resolve type from type object with function',
      },
      {
        expected: ((): InterfaceResolveTypeResponse => {
          const errorResponse = new InterfaceResolveTypeResponse();
          const error = new DriverError();
          error.setMsg('test error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation(() => {
          throw new Error('test error');
        }),
        title: 'throwing error',
      },
      {
        expected: ((): InterfaceResolveTypeResponse => {
          const errorResponse = new InterfaceResolveTypeResponse();
          const error = new DriverError();
          error.setMsg('type cannot be empty');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation(() => ''),
        title: 'test throwing error on falsy type name',
      },
      {
        expected: ((): InterfaceResolveTypeResponse => {
          const errorResponse = new InterfaceResolveTypeResponse();
          const error = new DriverError();
          error.setMsg('user error value');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation(() => ({
          error: {
            name: 'user error',
            message: 'user error value',
          },
        })),
        title: 'handle user error not thrown',
      },
    ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module:
              | ((input: InterfaceResolveTypeInput) => InterfaceResolveTypeOutput)
              | { [k: string]: (input: InterfaceResolveTypeInput) => InterfaceResolveTypeOutput };
            if (d.expectedFunctionName) {
              module = {};
              module[d.expectedFunctionName] = d.implementation;
            } else {
              module = d.implementation;
            }
            return module;
          },
          { virtual: true },
        );
        const info = {
          getFieldname: jest.fn(() => 'field'),
          getReturntype: jest.fn(() => ({ getName: jest.fn(() => 'String') })),
          getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>([])),
          hasOperation: jest.fn(() => false),
          hasParenttype: jest.fn(() => false),
          hasPath: jest.fn(() => false),
        };
        const call = {
          request: {
            getFunction: jest.fn(() => ({
              getName: jest.fn(() => d.functionName),
            })),
            getInfo: jest.fn(() => info),
            getValue: jest.fn(() => new Value()),
            hasFunction: jest.fn(() => true),
          },
        };
        const unary = (call as unknown) as ServerUnaryCall<InterfaceResolveTypeRequest>;
        const srv = new Server({ server });
        const cb = jest.fn();
        await srv.interfaceResolveType(unary, cb);
        expect(call.request.hasFunction).toBeCalledTimes(1);
        expect(call.request.getFunction).toBeCalledTimes(1);
        expect(call.request.getInfo).toBeCalledTimes(1);
        expect(call.request.getValue).toBeCalledTimes(1);
        expect(info.hasOperation).toBeCalledTimes(1);
        expect(info.getVariablevaluesMap).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(null, d.expected);
      });
    });
  });
  describe('parses scalar', () => {
    const newImplementation = (f: () => ScalarParseOutput): jest.Mock<ScalarParseOutput, [ScalarParseInput]> => {
      return jest.fn<ScalarParseOutput, [ScalarParseInput]>(f);
    };
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new ScalarParseResponse();
    const v = new Value();
    v.setS('value');
    expectedResponse.setValue(v);
    const data: Array<{
      title: string;
      functionName: string;
      expectedFunctionName?: string;
      expectedImport: string;
      implementation: jest.Mock<ScalarParseOutput, [ScalarParseInput]>;
      expected: ScalarParseResponse;
      inputValue?: Value;
      expectedInput?: unknown;
    }> = [
      {
        expected: expectedResponse,
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => 'value'),
        title: 'without function name and function export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => 'value'),
        title: 'without function name and with handler export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'name',
        expectedImport: 'parse',
        functionName: 'parse.name',
        implementation: newImplementation((): unknown => 'value'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => (): unknown => 'value'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => ({ response: 'value' })),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => ({ response: (): unknown => 'value' })),
        title: 'with function name',
      },
      {
        expected: ((): ScalarParseResponse => {
          const errorResponse = new ScalarParseResponse();
          const error = new DriverError();
          error.setMsg('test error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'parse',
        functionName: 'parse',
        implementation: newImplementation((): unknown => {
          throw new Error('test error');
        }),
        title: 'throwing error',
      },
      {
        expected: ((): ScalarParseResponse => {
          const errorResponse = new ScalarParseResponse();
          const error = new DriverError();
          error.setMsg('user error value');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): unknown => ({
          error: {
            message: 'user error value',
          },
        })),
        title: 'handle user error not thrown',
      },
      {
        expected: expectedResponse,
        expectedImport: 'parse',
        expectedInput: {
          any: Uint8Array.from(Buffer.from('data')),
          array: ['data'],
          boolean: true,
          floating: 1.1,
          integral: 1,
          nullObject: null,
          object: {
            key: 'data',
          },
          string: 'data',
          unsignedIntegral: 1,
        },
        functionName: 'parse',
        implementation: newImplementation((): unknown => 'value'),
        inputValue: ((): Value => {
          /*eslint-disable @typescript-eslint/no-non-null-assertion*/
          const dataStringValue = new Value();
          dataStringValue.setS('data');
          const anyValue = new Value();
          anyValue.setAny(Uint8Array.from(Buffer.from('data')));
          const arrayValue = new Value();
          arrayValue.setA(new ArrayValue());
          arrayValue.getA()!.addItems(dataStringValue);
          const booleanValue = new Value();
          booleanValue.setB(true);
          const floatingValue = new Value();
          floatingValue.setF(1.1);
          const integralValue = new Value();
          integralValue.setI(1);
          const unsignedIntegralValue = new Value();
          unsignedIntegralValue.setU(1);
          const nullObjectValue = new Value();
          const objectValue = new Value();
          objectValue.setO(new ObjectValue());
          objectValue
            .getO()!
            .getPropsMap()
            .set('key', dataStringValue);
          const expectedValue = new Value();
          expectedValue.setO(new ObjectValue());
          expectedValue
            .getO()!
            .getPropsMap()
            .set('any', anyValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('array', arrayValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('boolean', booleanValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('floating', floatingValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('integral', integralValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('unsignedIntegral', unsignedIntegralValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('nullObject', nullObjectValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('object', objectValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('string', dataStringValue);
          /*eslint-enable @typescript-eslint/no-non-null-assertion*/
          return expectedValue;
        })(),
        title: 'parse any value properly',
      },
    ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module:
              | ((input: ScalarParseInput) => ScalarParseOutput)
              | { [k: string]: (input: ScalarParseInput) => ScalarParseOutput };
            if (d.expectedFunctionName) {
              module = {};
              module[d.expectedFunctionName] = d.implementation;
            } else {
              module = d.implementation;
            }
            return module;
          },
          { virtual: true },
        );
        const call = {
          request: {
            getFunction: jest.fn(() => ({
              getName: jest.fn(() => d.functionName),
            })),
            getValue: jest.fn(() => d.inputValue),
            hasFunction: jest.fn(() => true),
          },
        };
        const unary = (call as unknown) as ServerUnaryCall<ScalarParseRequest>;
        const srv = new Server({ server });
        const cb = jest.fn();
        await srv.scalarParse(unary, cb);
        expect(call.request.hasFunction).toBeCalledTimes(1);
        expect(call.request.getFunction).toBeCalledTimes(1);
        expect(call.request.getValue).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(null, d.expected);
        expect(d.implementation).toHaveBeenCalledWith({ value: d.expectedInput });
      });
    });
  });
  describe('serialize scalar', () => {
    const newImplementation = (
      f: () => ScalarSerializeOutput,
    ): jest.Mock<ScalarSerializeOutput, [ScalarSerializeInput]> => {
      return jest.fn<ScalarSerializeOutput, [ScalarSerializeInput]>(f);
    };
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new ScalarSerializeResponse();
    const v = new Value();
    v.setS('value');
    expectedResponse.setValue(v);
    const data: Array<{
      title: string;
      functionName: string;
      expectedFunctionName?: string;
      expectedImport: string;
      implementation: jest.Mock<ScalarSerializeOutput, [ScalarSerializeInput]>;
      expected: ScalarSerializeResponse;
    }> = [
      {
        expected: expectedResponse,
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => 'value'),
        title: 'without function name and function export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => 'value'),
        title: 'without function name and with handler export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'name',
        expectedImport: 'serialize',
        functionName: 'serialize.name',
        implementation: newImplementation((): unknown => 'value'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => (): unknown => 'value'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => ({ response: 'value' })),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => ({ response: (): unknown => 'value' })),
        title: 'with function name',
      },
      {
        expected: ((): ScalarSerializeResponse => {
          const errorResponse = new ScalarSerializeResponse();
          const error = new DriverError();
          error.setMsg('test error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation((): unknown => {
          throw new Error('test error');
        }),
        title: 'throwing error',
      },
      {
        expected: ((): ScalarSerializeResponse => {
          /*eslint-disable @typescript-eslint/no-non-null-assertion*/
          const dataStringValue = new Value();
          dataStringValue.setS('data');
          const anyFromBufferValue = new Value();
          anyFromBufferValue.setAny(Uint8Array.from(Buffer.from('data')));
          const anyFromViewValue = new Value();
          anyFromViewValue.setAny(Uint8Array.from(Buffer.from('data')));
          const arrayValue = new Value();
          arrayValue.setA(new ArrayValue());
          arrayValue.getA()!.addItems(dataStringValue);
          const booleanValue = new Value();
          booleanValue.setB(true);
          const floatingValue = new Value();
          floatingValue.setF(1.1);
          const integralValue = new Value();
          integralValue.setI(1);
          const nullObjectValue = new Value();
          const objectValue = new Value();
          objectValue.setO(new ObjectValue());
          objectValue
            .getO()!
            .getPropsMap()
            .set('key', dataStringValue);
          const expectedValue = new Value();
          expectedValue.setO(new ObjectValue());
          expectedValue
            .getO()!
            .getPropsMap()
            .set('anyFromBuffer', anyFromBufferValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('anyFromView', anyFromViewValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('array', arrayValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('boolean', booleanValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('floating', floatingValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('integral', integralValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('nullObject', nullObjectValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('object', objectValue);
          expectedValue
            .getO()!
            .getPropsMap()
            .set('string', dataStringValue);
          const response = new ScalarSerializeResponse();
          response.setValue(expectedValue);
          return response;
          /*eslint-enable @typescript-eslint/no-non-null-assertion*/
        })(),
        expectedImport: 'serialize',
        functionName: 'serialize',
        implementation: newImplementation(() => ({
          anyFromBuffer: Buffer.from('data'),
          anyFromView: Uint8Array.from(Buffer.from('data')),
          array: ['data'],
          boolean: true,
          floating: 1.1,
          integral: 1,
          nullObject: null,
          object: {
            key: 'data',
          },
          string: 'data',
        })),
        title: 'serializes any value properly',
      },
    ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module:
              | ((input: ScalarSerializeInput) => ScalarSerializeOutput)
              | { [k: string]: (input: ScalarSerializeInput) => ScalarSerializeOutput };
            if (d.expectedFunctionName) {
              module = {};
              module[d.expectedFunctionName] = d.implementation;
            } else {
              module = d.implementation;
            }
            return module;
          },
          { virtual: true },
        );
        const call = {
          request: {
            getFunction: jest.fn(() => ({
              getName: jest.fn(() => d.functionName),
            })),
            getValue: jest.fn(() => new Value()),
            hasFunction: jest.fn(() => true),
          },
        };
        const unary = (call as unknown) as ServerUnaryCall<ScalarSerializeRequest>;
        const srv = new Server({ server });
        const cb = jest.fn();
        await srv.scalarSerialize(unary, cb);
        expect(call.request.hasFunction).toBeCalledTimes(1);
        expect(call.request.getFunction).toBeCalledTimes(1);
        expect(call.request.getValue).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(null, d.expected);
      });
    });
  });
  describe('resolves union type', () => {
    const newImplementation = (
      f: () => UnionResolveTypeOutput,
    ): jest.Mock<UnionResolveTypeOutput, [UnionResolveTypeInput]> => {
      return jest.fn<UnionResolveTypeOutput, [UnionResolveTypeInput]>(f);
    };
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new UnionResolveTypeResponse();
    const t = new TypeRef();
    t.setName('String');
    expectedResponse.setType(t);
    const data: Array<{
      title: string;
      functionName: string;
      expectedFunctionName?: string;
      expectedImport: string;
      implementation: jest.Mock<UnionResolveTypeOutput, [UnionResolveTypeInput]>;
      expected: UnionResolveTypeResponse;
    }> = [
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): string => 'String'),
        title: 'without function name and function export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'handler',
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): string => 'String'),
        title: 'without function name and with handler export',
      },
      {
        expected: expectedResponse,
        expectedFunctionName: 'name',
        expectedImport: 'resolveType',
        functionName: 'resolveType.name',
        implementation: newImplementation((): string => 'String'),
        title: 'with function name',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): (() => string) => (): string => 'String'),
        title: 'resolve type from function',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): { type: string } => ({ type: 'String' })),
        title: 'resolve type from type object',
      },
      {
        expected: expectedResponse,
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): { type: () => string } => ({ type: (): string => 'String' })),
        title: 'resolve type from type object with function',
      },
      {
        expected: ((): UnionResolveTypeResponse => {
          const errorResponse = new UnionResolveTypeResponse();
          const error = new DriverError();
          error.setMsg('test error');
          errorResponse.setError(error);
          return errorResponse;
        })(),
        expectedImport: 'resolveType',
        functionName: 'resolveType',
        implementation: newImplementation((): string => {
          throw new Error('test error');
        }),
        title: 'throwing error',
      },
    ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module:
              | ((input: UnionResolveTypeInput) => UnionResolveTypeOutput)
              | { [k: string]: (input: UnionResolveTypeInput) => UnionResolveTypeOutput };
            if (d.expectedFunctionName) {
              module = {};
              module[d.expectedFunctionName] = d.implementation;
            } else {
              module = d.implementation;
            }
            return module;
          },
          { virtual: true },
        );
        const info = {
          getFieldname: jest.fn(() => 'field'),
          getReturntype: jest.fn(() => ({ getName: jest.fn(() => 'String') })),
          getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>([])),
          hasOperation: jest.fn(() => false),
          hasParenttype: jest.fn(() => false),
          hasPath: jest.fn(() => false),
        };
        const call = {
          request: {
            getFunction: jest.fn(() => ({
              getName: jest.fn(() => d.functionName),
            })),
            getInfo: jest.fn(() => info),
            getValue: jest.fn(() => new Value()),
            hasFunction: jest.fn(() => true),
          },
        };
        const unary = (call as unknown) as ServerUnaryCall<UnionResolveTypeRequest>;
        const srv = new Server({ server });
        const cb = jest.fn();
        await srv.unionResolveType(unary, cb);
        expect(call.request.hasFunction).toBeCalledTimes(1);
        expect(call.request.getFunction).toBeCalledTimes(1);
        expect(call.request.getInfo).toBeCalledTimes(1);
        expect(call.request.getValue).toBeCalledTimes(1);
        expect(info.hasOperation).toBeCalledTimes(1);
        expect(info.getVariablevaluesMap).toBeCalledTimes(1);
        expect(cb).toBeCalledWith(null, d.expected);
      });
    });
  });
  it('requires function', async () => {
    const info = {
      getFieldname: jest.fn(() => 'field'),
      getReturntype: jest.fn(() => ({ getName: jest.fn(() => 'String') })),
      getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>([])),
      hasOperation: jest.fn(() => false),
      hasParenttype: jest.fn(() => false),
      hasPath: jest.fn(() => false),
    };
    const call = {
      request: {
        getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>([])),
        getInfo: jest.fn(() => info),
        hasFunction: jest.fn(() => false),
        hasProtocol: jest.fn(() => false),
        hasSource: jest.fn(() => false),
      },
    };
    const srv = new Server({ server });
    const cb = jest.fn();
    const unary = (call as unknown) as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg('missing function');
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
  it('requires function name', async () => {
    const info = {
      getFieldname: jest.fn(() => 'field'),
      getReturntype: jest.fn(() => ({ getName: jest.fn(() => 'String') })),
      getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>([])),
      hasOperation: jest.fn(() => false),
      hasParenttype: jest.fn(() => false),
      hasPath: jest.fn(() => false),
    };
    const call = {
      request: {
        getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>([])),
        getFunction: jest.fn(() => ({
          getName: jest.fn(() => ''),
        })),
        getInfo: jest.fn(() => info),
        hasFunction: jest.fn(() => true),
        hasProtocol: jest.fn(() => false),
        hasSource: jest.fn(() => false),
      },
    };
    const srv = new Server({ server });
    const cb = jest.fn();
    const unary = (call as unknown) as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg('function name is empty');
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
  it('requires info object', async () => {
    jest.mock(
      `${process.cwd()}/name`,
      (): unknown => (): unknown => {
        return;
      },
      { virtual: true },
    );
    const call = {
      request: {
        getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>([])),
        getFunction: jest.fn(() => ({
          getName: jest.fn(() => 'name'),
        })),
        getInfo: jest.fn(() => undefined),
        hasFunction: jest.fn(() => true),
        hasProtocol: jest.fn(() => false),
        hasSource: jest.fn(() => false),
      },
    };
    const srv = new Server({ server });
    const cb = jest.fn();
    const unary = (call as unknown) as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg('info is required');
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
  it('hijacks io', () => {
    let stdout: (call: Writable) => void = () => {};
    let stderr: (call: Writable) => void = () => {};
    const srv = new Server({
      server: {
        addService: (jest.fn(
          (
            first,
            second: {
              fieldResolve: unknown;
              interfaceResolveType: unknown;
              scalarParse: unknown;
              scalarSerialize: unknown;
              stderr: (call: Writable) => void;
              stdout: (call: Writable) => void;
              stream: unknown;
              unionResolveType: unknown;
            },
          ) => {
            stderr = second.stderr;
            stdout = second.stdout;
          },
        ) as unknown) as typeof grpc.Server.prototype.addService,
        bind: jest.fn(),
        start: jest.fn(),
        tryShutdown: jest.fn(),
      },
    });
    expect(server.addService).toBeCalledWith(expect.anything(), expect.anything());
    expect(server.addService).toBeCalledWith(
      DriverService,
      expect.objectContaining({
        fieldResolve: expect.anything(),
        interfaceResolveType: expect.anything(),
        scalarParse: expect.anything(),
        scalarSerialize: expect.anything(),
        unionResolveType: expect.anything(),
      }),
    );
    const stdoutStream = new Writable();
    const stdoutWrite = jest.fn();
    stdoutStream.write = stdoutWrite;
    const stderrWrite = jest.fn();
    const stderrStream = new Writable();
    stderrStream.write = stderrWrite;
    const oldConsoleLog = console.log;
    console.log = jest.fn((msg: string): void => {
      process.stdout.write(msg);
    });
    const oldConsoleInfo = console.info;
    console.info = jest.fn((msg: string): void => {
      process.stdout.write(msg);
    });
    const oldConsoleDebug = console.debug;
    console.debug = jest.fn((msg: string): void => {
      process.stdout.write(msg);
    });
    const oldConsoleWarn = console.warn;
    console.warn = jest.fn((msg: string): void => {
      process.stderr.write(msg);
    });
    const oldConsoleError = console.error;
    console.error = jest.fn((msg: string): void => {
      process.stderr.write(msg);
    });
    stdout(stdoutStream);
    stderr(stderrStream);
    const oldIO = srv.setupIO();
    console.log('log msg');
    console.info('info msg');
    console.debug('debug msg');
    console.warn('warn msg');
    console.error('err msg');
    const byteStream = new ByteStream();
    byteStream.setData(Uint8Array.from(Buffer.from('[INFO]log msg')));
    expect(stdoutWrite).toHaveBeenCalledWith(byteStream, expect.anything());
    byteStream.setData(Uint8Array.from(Buffer.from('[INFO]info msg')));
    expect(stdoutWrite).toHaveBeenCalledWith(byteStream, expect.anything());
    byteStream.setData(Uint8Array.from(Buffer.from('[DEBUG]debug msg')));
    expect(stdoutWrite).toHaveBeenCalledWith(byteStream, expect.anything());
    byteStream.setData(Uint8Array.from(Buffer.from('[WARN]warn msg')));
    expect(stderrWrite).toHaveBeenCalledWith(byteStream, expect.anything());
    byteStream.setData(Uint8Array.from(Buffer.from('[ERROR]err msg')));
    expect(stderrWrite).toHaveBeenCalledWith(byteStream, expect.anything());
    srv.closeStreams(oldIO);
    console.log = oldConsoleLog;
    console.info = oldConsoleInfo;
    console.debug = oldConsoleDebug;
    console.warn = oldConsoleWarn;
    console.error = oldConsoleError;
  });
});
