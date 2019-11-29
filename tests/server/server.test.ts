import * as jspb from "google-protobuf";
import { ServerUnaryCall } from "grpc";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService,
} from "grpc-ts-health-check";
import { IFieldResolveInput } from "../../src/api";
import { DriverService } from "../../src/proto/driver_grpc_pb";
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
} from "../../src/proto/driver_pb";
import { Server } from "../../src/server/server";

describe("grpc server", () => {
  const server = {
    addService: jest.fn(),
    bind: jest.fn(),
    start: jest.fn(),
    tryShutdown: jest.fn(),
  };
  it("adds services", () => {
    const _ = new Server({ server });
    expect(server.addService).toBeCalledWith(HealthService, new GrpcHealthCheck({
      plugin: HealthCheckResponse.ServingStatus.SERVING,
    }));
    expect(server.addService).toBeCalledWith(DriverService, expect.objectContaining({
      fieldResolve: expect.anything(),
      interfaceResolveType: expect.anything(),
      scalarParse: expect.anything(),
      scalarSerialize: expect.anything(),
      unionResolveType: expect.anything(),
    }));
    expect(server.addService).toBeCalledTimes(2);
  });
  describe("resolves field", () => {
    afterEach(() => {
      jest.resetModules();
    });
    const epxectedFieldResponse = new FieldResolveResponse();
    const v = new Value();
    v.setS("test response");
    epxectedFieldResponse.setResponse(v);
    const data: Array<{
      title: string,
      functionName: string,
      expectedFunctionName?: string,
      expectedImport: string,
      implementation: jest.Mock<any, any>,
      implementationCalledWith: IFieldResolveInput,
      inputArguments?: Array<[string, Value]>,
      inputSource?: Value,
      inputProtocol?: Value,
      inputPath?: ResponsePath,
      inputReturntype?: TypeRef,
      inputVariablevalues?: Array<[string, Value]>,
      inputOperation?: OperationDefinition,
      inputParentType?: TypeRef,
      expected: FieldResolveResponse,
    }> = [
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "without function name and function export",
        },
        {
          expected: epxectedFieldResponse,
          expectedFunctionName: "handler",
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "without function name and with handler export",
        },
        {
          expected: epxectedFieldResponse,
          expectedFunctionName: "name",
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName.name",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "with function name",
        },
        {
          expected: epxectedFieldResponse,
          expectedFunctionName: "handler",
          expectedImport: "resolveFieldName.js",
          functionName: "resolveFieldName.js",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "default handler for .js extension",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => () => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "resolve field from function",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => ({ response: "test response" })),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "resolve field from type object",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => ({ response: () => "test response" })),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "resolve field from type object with function",
        },
        {
          expected: (() => {
            const expectedResponse = new FieldResolveResponse();
            expectedResponse.setResponse(new Value());
            return expectedResponse;
          })(),
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => undefined),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "resolve field from undefined",
        },
        {
          expected: (() => {
            const errorResponse = new FieldResolveResponse();
            const error = new DriverError();
            error.setMsg("test error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => { throw new Error("test error"); }),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "throwing error",
        },
        {
          expected: (() => {
            const errorResponse = new FieldResolveResponse();
            const error = new DriverError();
            error.setMsg("unknown error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => { throw {}; }),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "throwing bad error",
        },
        {
          expected: (() => {
            const errorResponse = new FieldResolveResponse();
            const error = new DriverError();
            error.setMsg("user error value");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => ({
            error: {
              message: "user error value",
            },
          })),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
          },
          title: "handle user error not thrown",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            arguments: {
              arg: "value",
            },
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
            },
            protocol: {
              headers: {
                HTTP_HEADER: ["value"],
              },
            },
            source: "some source",
          },
          inputArguments: (() => {
            const argVal = new Value();
            argVal.setS("value");
            const args = new Array<[string, Value]>();
            args.push(["arg", argVal]);
            return args;
          })(),
          inputProtocol: (() => {
            const value = new Value();
            value.setS("value");
            const httpHeaderArray = new ArrayValue();
            httpHeaderArray.addItems(value);
            const httpHeader = new Value();
            httpHeader.setA(httpHeaderArray);
            const protocolObject = new ObjectValue();
            protocolObject.getPropsMap().set("HTTP_HEADER", httpHeader);
            const protocol = new Value();
            protocol.setO(protocolObject);
            return protocol;
          })(),
          inputSource: (() => {
            const source = new Value();
            source.setS("some source");
            return source;
          })(),
          title: "without function name and function export",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              path: {
                key: "sub",
                prev: {
                  key: "root",
                },
              },
              returnType: {
                name: "String",
              },
            },
          },
          inputPath: (() => {
            const rp = new ResponsePath();
            rp.setKey("sub");
            const prev = new ResponsePath();
            prev.setKey("root");
            rp.setPrev(prev);
            return rp;
          })(),
          title: "with resolve path",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                list: {
                  nonNull: {
                    name: "String",
                  },
                },
              },
            },
          },
          inputReturntype: (() => {
            const rt = new TypeRef();
            const nonNull = new TypeRef();
            rt.setList(nonNull);
            const stringType = new TypeRef();
            nonNull.setNonnull(stringType);
            stringType.setName("String");
            return rt;
          })(),
          title: "with return type",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              returnType: {
                name: "String",
              },
              variableValues: {
                var: "value",
              },
            },
          },
          inputVariablevalues: (() => {
            const value = new Value();
            value.setS("value");
            const arr = new Array<[string, Value]>();
            arr.push(["var", value]);
            return arr;
          })(),
          title: "with variable values",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              operation: {
                directives: [
                  {
                    arguments: {
                      arg: "value",
                    },
                    name: "@somedir",
                  },
                ],
                name: "someop",
                operation: "query",
                selectionSet: [
                  {
                    arguments: {
                      arg: "value",
                    },
                    directives: [
                      {
                        arguments: {
                          arg: "value",
                        },
                        name: "@somedir",
                      },
                    ],
                    name: "field",
                    selectionSet: [
                      {
                        arguments: {
                          arg: "value",
                        },
                        directives: [
                          {
                            arguments: {
                              arg: "value",
                            },
                            name: "@somedir",
                          },
                        ],
                        name: "field",
                      },
                      {
                        definition: {
                          directives: [
                            {
                              arguments: {
                                arg: "value",
                              },
                              name: "@somedir",
                            },
                          ],
                          selectionSet: [
                            {
                              arguments: {
                                arg: "value",
                              },
                              directives: [
                                {
                                  arguments: {
                                    arg: "value",
                                  },
                                  name: "@somedir",
                                },
                              ],
                              name: "field",
                            },
                          ],
                          typeCondition: {
                            name: "SomeType",
                          },
                          variableDefinitions: [
                            {
                              defaultValue: "value",
                              variable: {
                                name: "var",
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
                            arg: "value",
                          },
                          name: "@somedir",
                        },
                      ],
                      selectionSet: [
                        {
                          arguments: {
                            arg: "value",
                          },
                          directives: [
                            {
                              arguments: {
                                arg: "value",
                              },
                              name: "@somedir",
                            },
                          ],
                          name: "field",
                        },
                      ],
                      typeCondition: {
                        name: "SomeType",
                      },
                      variableDefinitions: [
                        {
                          defaultValue: "value",
                          variable: {
                            name: "var",
                          },
                        },
                      ],
                    },
                  },
                ],
                variableDefinitions: [
                  {
                    defaultValue: "value",
                    variable: {
                      name: "var",
                    },
                  },
                ],
              },
              returnType: {
                name: "String",
              },
            },
          },
          inputOperation: (() => {
            const op = new OperationDefinition();
            op.setOperation("query");
            op.setName("someop");
            const variableDefinition = new VariableDefinition();
            const badVariableDefinition = new VariableDefinition();
            const defaultValue = new Value();
            defaultValue.setS("value");
            const variable = new Variable();
            variable.setName("var");
            variableDefinition.setDefaultvalue(defaultValue);
            variableDefinition.setVariable(variable);
            op.setVariabledefinitionsList([variableDefinition, badVariableDefinition]);
            const directive = new Directive();
            directive.setName("@somedir");
            const argValue = new Value();
            argValue.setS("value");
            directive.getArgumentsMap().set("arg", argValue);
            op.setDirectivesList([directive]);
            const fieldSelection = new Selection();
            fieldSelection.setName("field");
            fieldSelection.getArgumentsMap().set("arg", argValue);
            fieldSelection.setDirectivesList([directive]);
            const fragmentSelection = new Selection();
            const fragmentDefinition = new FragmentDefinition();
            fragmentDefinition.setDirectivesList([directive]);
            fragmentDefinition.setVariabledefinitionsList([variableDefinition]);
            const someTypeRef = new TypeRef();
            someTypeRef.setName("SomeType");
            fragmentDefinition.setTypecondition(someTypeRef);
            fragmentDefinition.setSelectionsetList([fieldSelection]);
            const rootFieldSelection = new Selection();
            rootFieldSelection.setName("field");
            rootFieldSelection.getArgumentsMap().set("arg", argValue);
            rootFieldSelection.setDirectivesList([directive]);
            rootFieldSelection.setSelectionsetList([fieldSelection, fragmentSelection]);
            fragmentSelection.setDefinition(fragmentDefinition);
            op.setSelectionsetList([rootFieldSelection, fragmentSelection]);
            return op;
          })(),
          title: "with operation",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              operation: undefined,
              returnType: {
                name: "String",
              },
            },
          },
          inputOperation: undefined,
          title: "with undefined operation",
        },
        {
          expected: epxectedFieldResponse,
          expectedImport: "resolveFieldName",
          functionName: "resolveFieldName",
          implementation: jest.fn(() => "test response"),
          implementationCalledWith: {
            info: {
              fieldName: "field",
              parentType: {
                name: "String",
              },
              returnType: {
                name: "String",
              },
            },
          },
          inputParentType: (() => {
            const pt = new TypeRef();
            pt.setName("String");
            return pt;
          })(),
          title: "with parent type",
        },
      ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module: (() => {}) | { [k: string]: () => {} };
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
          getFieldname: jest.fn(() => "field"),
          getOperation: jest.fn(() => d.inputOperation),
          getParenttype: jest.fn(() => d.inputParentType),
          getPath: jest.fn(() => d.inputPath),
          getReturntype: jest.fn(() => (d.inputReturntype || { getName: jest.fn(() => "String") })),
          getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>(d.inputVariablevalues || [])),
          hasOperation: jest.fn(() => "inputOperation" in d),
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
        const unary = call as unknown as ServerUnaryCall<FieldResolveRequest>;
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
  describe("resolves interface type", () => {
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new InterfaceResolveTypeResponse();
    const t = new TypeRef();
    t.setName("String");
    expectedResponse.setType(t);
    const data: Array<{
      title: string
      functionName: string
      expectedFunctionName?: string
      expectedImport: string
      implementation: jest.Mock<any, any>
      expected: InterfaceResolveTypeResponse,
    }> = [
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => "String"),
          title: "without function name and function export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "handler",
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => "String"),
          title: "without function name and with handler export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "name",
          expectedImport: "resolveType",
          functionName: "resolveType.name",
          implementation: jest.fn(() => "String"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => () => "String"),
          title: "resolve type from function",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({ type: "String" })),
          title: "resolve type from type object",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({ type: () => "String" })),
          title: "resolve type from type object with function",
        },
        {
          expected: (() => {
            const errorResponse = new InterfaceResolveTypeResponse();
            const error = new DriverError();
            error.setMsg("test error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => { throw new Error("test error"); }),
          title: "throwing error",
        },
        {
          expected: (() => {
            const errorResponse = new InterfaceResolveTypeResponse();
            const error = new DriverError();
            error.setMsg("type cannot be empty");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ""),
          title: "test throwing error on falsy type name",
        },
        {
          expected: (() => {
            const errorResponse = new InterfaceResolveTypeResponse();
            const error = new DriverError();
            error.setMsg("user error value");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({
            error: {
              message: "user error value",
            },
          })),
          title: "handle user error not thrown",
        },
      ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module: (() => {}) | { [k: string]: () => {} };
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
          getFieldname: jest.fn(() => "field"),
          getReturntype: jest.fn(() => ({ getName: jest.fn(() => "String") })),
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
        const unary = call as unknown as ServerUnaryCall<InterfaceResolveTypeRequest>;
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
  describe("parses scalar", () => {
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new ScalarParseResponse();
    const v = new Value();
    v.setS("value");
    expectedResponse.setValue(v);
    const data: Array<{
      title: string
      functionName: string
      expectedFunctionName?: string
      expectedImport: string
      implementation: jest.Mock<any, any>
      expected: ScalarParseResponse,
      inputValue?: Value,
      expectedInput?: any,
    }> = [
        {
          expected: expectedResponse,
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => "value"),
          title: "without function name and function export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "handler",
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => "value"),
          title: "without function name and with handler export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "name",
          expectedImport: "parse",
          functionName: "parse.name",
          implementation: jest.fn(() => "value"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => () => "value"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => ({ response: "value" })),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => ({ response: () => "value" })),
          title: "with function name",
        },
        {
          expected: (() => {
            const errorResponse = new ScalarParseResponse();
            const error = new DriverError();
            error.setMsg("test error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "parse",
          functionName: "parse",
          implementation: jest.fn(() => { throw new Error("test error"); }),
          title: "throwing error",
        },
        {
          expected: (() => {
            const errorResponse = new ScalarParseResponse();
            const error = new DriverError();
            error.setMsg("user error value");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({
            error: {
              message: "user error value",
            },
          })),
          title: "handle user error not thrown",
        },
        {
          expected: expectedResponse,
          expectedImport: "parse",
          expectedInput: {
            any: Uint8Array.from(Buffer.from("data")),
            array: ["data"],
            boolean: true,
            floating: 1.1,
            integral: 1,
            nullObject: null,
            object: {
              key: "data",
            },
            string: "data",
            unsignedIntegral: 1,
          },
          functionName: "parse",
          implementation: jest.fn(() => "value"),
          inputValue: (() => {
            const dataStringValue = new Value();
            dataStringValue.setS("data");
            const anyValue = new Value();
            anyValue.setAny(Uint8Array.from(Buffer.from("data")));
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
            objectValue.getO()!.getPropsMap().set("key", dataStringValue);
            const expectedValue = new Value();
            expectedValue.setO(new ObjectValue());
            expectedValue.getO()!.getPropsMap().set("any", anyValue);
            expectedValue.getO()!.getPropsMap().set("array", arrayValue);
            expectedValue.getO()!.getPropsMap().set("boolean", booleanValue);
            expectedValue.getO()!.getPropsMap().set("floating", floatingValue);
            expectedValue.getO()!.getPropsMap().set("integral", integralValue);
            expectedValue.getO()!.getPropsMap().set("unsignedIntegral", unsignedIntegralValue);
            expectedValue.getO()!.getPropsMap().set("nullObject", nullObjectValue);
            expectedValue.getO()!.getPropsMap().set("object", objectValue);
            expectedValue.getO()!.getPropsMap().set("string", dataStringValue);
            return expectedValue;
          })(),
          title: "parse any value properly",
        },
      ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module: (() => {}) | { [k: string]: () => {} };
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
        const unary = call as unknown as ServerUnaryCall<ScalarParseRequest>;
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
  describe("serialize scalar", () => {
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new ScalarSerializeResponse();
    const v = new Value();
    v.setS("value");
    expectedResponse.setValue(v);
    const data: Array<{
      title: string
      functionName: string
      expectedFunctionName?: string
      expectedImport: string
      implementation: jest.Mock<any, any>
      expected: ScalarSerializeResponse,
    }> = [
        {
          expected: expectedResponse,
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => "value"),
          title: "without function name and function export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "handler",
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => "value"),
          title: "without function name and with handler export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "name",
          expectedImport: "serialize",
          functionName: "serialize.name",
          implementation: jest.fn(() => "value"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => () => "value"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => ({ response: "value" })),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => ({ response: () => "value" })),
          title: "with function name",
        },
        {
          expected: (() => {
            const errorResponse = new ScalarSerializeResponse();
            const error = new DriverError();
            error.setMsg("test error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => { throw new Error("test error"); }),
          title: "throwing error",
        },
        {
          expected: (() => {
            const dataStringValue = new Value();
            dataStringValue.setS("data");
            const anyFromBufferValue = new Value();
            anyFromBufferValue.setAny(Uint8Array.from(Buffer.from("data")));
            const anyFromViewValue = new Value();
            anyFromViewValue.setAny(Uint8Array.from(Buffer.from("data")));
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
            objectValue.getO()!.getPropsMap().set("key", dataStringValue);
            const expectedValue = new Value();
            expectedValue.setO(new ObjectValue());
            expectedValue.getO()!.getPropsMap().set("anyFromBuffer", anyFromBufferValue);
            expectedValue.getO()!.getPropsMap().set("anyFromView", anyFromViewValue);
            expectedValue.getO()!.getPropsMap().set("array", arrayValue);
            expectedValue.getO()!.getPropsMap().set("boolean", booleanValue);
            expectedValue.getO()!.getPropsMap().set("floating", floatingValue);
            expectedValue.getO()!.getPropsMap().set("integral", integralValue);
            expectedValue.getO()!.getPropsMap().set("nullObject", nullObjectValue);
            expectedValue.getO()!.getPropsMap().set("object", objectValue);
            expectedValue.getO()!.getPropsMap().set("string", dataStringValue);
            const response = new ScalarSerializeResponse();
            response.setValue(expectedValue);
            return response;
          })(),
          expectedImport: "serialize",
          functionName: "serialize",
          implementation: jest.fn(() => ({
            anyFromBuffer: Buffer.from("data"),
            anyFromView: Uint8Array.from(Buffer.from("data")),
            array: ["data"],
            boolean: true,
            floating: 1.1,
            integral: 1,
            nullObject: null,
            object: {
              key: "data",
            },
            string: "data",
          })),
          title: "serializes any value properly",
        },
      ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module: (() => {}) | { [k: string]: () => {} };
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
        const unary = call as unknown as ServerUnaryCall<ScalarSerializeRequest>;
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
  describe("resolves union type", () => {
    afterEach(() => {
      jest.resetModules();
    });
    const expectedResponse = new UnionResolveTypeResponse();
    const t = new TypeRef();
    t.setName("String");
    expectedResponse.setType(t);
    const data: Array<{
      title: string
      functionName: string
      expectedFunctionName?: string
      expectedImport: string
      implementation: jest.Mock<any, any>
      expected: UnionResolveTypeResponse,
    }> = [
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => "String"),
          title: "without function name and function export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "handler",
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => "String"),
          title: "without function name and with handler export",
        },
        {
          expected: expectedResponse,
          expectedFunctionName: "name",
          expectedImport: "resolveType",
          functionName: "resolveType.name",
          implementation: jest.fn(() => "String"),
          title: "with function name",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => () => "String"),
          title: "resolve type from function",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({ type: "String" })),
          title: "resolve type from type object",
        },
        {
          expected: expectedResponse,
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => ({ type: () => "String" })),
          title: "resolve type from type object with function",
        },
        {
          expected: (() => {
            const errorResponse = new UnionResolveTypeResponse();
            const error = new DriverError();
            error.setMsg("test error");
            errorResponse.setError(error);
            return errorResponse;
          })(),
          expectedImport: "resolveType",
          functionName: "resolveType",
          implementation: jest.fn(() => { throw new Error("test error"); }),
          title: "throwing error",
        },
      ];
    data.forEach((d) => {
      it(d.title, async () => {
        jest.mock(
          `${process.cwd()}/${d.expectedImport}`,
          () => {
            let module: (() => {}) | { [k: string]: () => {} };
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
          getFieldname: jest.fn(() => "field"),
          getReturntype: jest.fn(() => ({ getName: jest.fn(() => "String") })),
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
        const unary = call as unknown as ServerUnaryCall<UnionResolveTypeRequest>;
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
  it("requires function", async () => {
    const info = {
      getFieldname: jest.fn(() => "field"),
      getReturntype: jest.fn(() => ({ getName: jest.fn(() => "String") })),
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
    const unary = call as unknown as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg("missing function");
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
  it("requires function name", async () => {
    const info = {
      getFieldname: jest.fn(() => "field"),
      getReturntype: jest.fn(() => ({ getName: jest.fn(() => "String") })),
      getVariablevaluesMap: jest.fn(() => new jspb.Map<string, Value>([])),
      hasOperation: jest.fn(() => false),
      hasParenttype: jest.fn(() => false),
      hasPath: jest.fn(() => false),
    };
    const call = {
      request: {
        getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>([])),
        getFunction: jest.fn(() => ({
          getName: jest.fn(() => ""),
        })),
        getInfo: jest.fn(() => info),
        hasFunction: jest.fn(() => true),
        hasProtocol: jest.fn(() => false),
        hasSource: jest.fn(() => false),
      },
    };
    const srv = new Server({ server });
    const cb = jest.fn();
    const unary = call as unknown as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg("function name is empty");
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
  it("requires info object", async () => {
    jest.mock(`${process.cwd()}/name`, () => (() => { return; }), { virtual: true });
    const call = {
      request: {
        getArgumentsMap: jest.fn(() => new jspb.Map<string, Value>([])),
        getFunction: jest.fn(() => ({
          getName: jest.fn(() => "name"),
        })),
        getInfo: jest.fn(() => undefined),
        hasFunction: jest.fn(() => true),
        hasProtocol: jest.fn(() => false),
        hasSource: jest.fn(() => false),
      },
    };
    const srv = new Server({ server });
    const cb = jest.fn();
    const unary = call as unknown as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(unary, cb);
    const response = new FieldResolveResponse();
    const err = new DriverError();
    err.setMsg("info is required");
    response.setError(err);
    expect(cb).toHaveBeenCalledWith(null, response);
  });
});
