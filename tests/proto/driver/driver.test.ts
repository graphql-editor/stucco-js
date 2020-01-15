import {
  makeProtoError,
  fieldResolve,
  interfaceResolveType,
  unionResolveType,
  scalarParse,
  scalarSerialize,
  setSecrets,
} from '../../../src/proto/driver';
import * as jspb from 'google-protobuf';
import {
  Error as ProtoError,
  FieldResolveRequest,
  FieldResolveResponse,
  FieldResolveInfo,
  Value,
  InterfaceResolveTypeInfo,
  UnionResolveTypeInfo,
  OperationDefinition,
  TypeRef,
  ResponsePath,
  Selection,
  Directive,
  FragmentDefinition,
  VariableDefinition,
  Variable,
  InterfaceResolveTypeRequest,
  InterfaceResolveTypeResponse,
  UnionResolveTypeRequest,
  UnionResolveTypeResponse,
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
  SetSecretsRequest,
  SetSecretsResponse,
  Secret,
} from '../../../src/proto/driver_pb';
import {
  FieldResolveInput,
  InterfaceResolveTypeInput,
  UnionResolveTypeInput,
  ScalarParseInput,
  ScalarSerializeInput,
} from '../../../src/api';
import { nilValue, stringValue, intValue, arrValue, objValue, variableValue } from './helpers';

const expectedSelections = [
  {
    name: 'field',
    arguments: {
      arg: 'value',
    },
    directives: [{ name: '@someDir' }],
    selectionSet: [{ name: 'subField' }],
  },
  {
    definition: {
      selectionSet: [{ name: 'field' }],
      typeCondition: {
        name: 'SomeType',
      },
      directives: [{ arguments: { arg: 'value' }, name: '@someDir' }],
    },
  },
];
function setSelections(v: { setSelectionsetList(s: Array<Selection>): void }): void {
  const selections = [new Selection(), new Selection(), new Selection()];

  const directives = [new Directive()];
  directives[0].setName('@someDir');

  const subFieldSelection = [new Selection()];
  subFieldSelection[0].setName('subField');

  selections[0].setName('field');
  selections[0].getArgumentsMap().set('arg', stringValue('value'));
  selections[0].setDirectivesList(directives);
  selections[0].setSelectionsetList(subFieldSelection);

  const definition = new FragmentDefinition();

  const fragmentSelection = [new Selection()];
  fragmentSelection[0].setName('field');

  const typeCondition = new TypeRef();
  typeCondition.setName('SomeType');

  const variable = new Variable();
  variable.setName('someVariable');
  const variableDefinitions = [new VariableDefinition()];
  variableDefinitions[0].setDefaultvalue(stringValue('someValue'));
  variableDefinitions[0].setVariable(variable);

  const definitionDirectives = [new Directive()];
  definitionDirectives[0].setName('@someDir');
  definitionDirectives[0].getArgumentsMap().set('arg', stringValue('value'));

  definition.setSelectionsetList(fragmentSelection);
  definition.setTypecondition(typeCondition);
  definition.setDirectivesList(definitionDirectives);
  definition.setVariabledefinitionsList(variableDefinitions);
  selections[1].setDefinition(definition);
  v.setSelectionsetList(selections);
}

const expectedVariableDefinitions = [
  {
    defaultValue: 'someDefaultValue',
    variable: {
      name: 'variable',
    },
  },
  {
    defaultValue: 'defaultValue',
    variable: {
      name: 'defaultVariable',
    },
  },
];
const setVariabledefinitions = (v: { setVariabledefinitionsList(vars: Array<VariableDefinition>): void }): void =>
  v.setVariabledefinitionsList(
    expectedVariableDefinitions.map(
      (variable): VariableDefinition => {
        const varDef = new VariableDefinition();
        varDef.setDefaultvalue(stringValue(variable.defaultValue));
        const varName = new Variable();
        varName.setName(variable.variable.name);
        varDef.setVariable(varName);
        return varDef;
      },
    ),
  );

const expectedOperation = {
  operation: 'query',
  name: 'someOp',
  selectionSet: expectedSelections,
  variableDefinitions: expectedVariableDefinitions,
};
function setOperation(v: { setOperation(odef: OperationDefinition): void }): void {
  const od = new OperationDefinition();
  od.setOperation('query');
  od.setName('someOp');
  setSelections(od);
  setVariabledefinitions(od);
  v.setOperation(od);
}

const expectedParentTypeRef = {
  name: 'SomeType',
};
function setParentType(v: { setParenttype(tr: TypeRef) }): void {
  const tr = new TypeRef();
  tr.setName('SomeType');
  v.setParenttype(tr);
}

const expectedTypeRef = {
  nonNull: {
    list: {
      name: 'SomeType',
    },
  },
};
function newExpectedTypeRef(): TypeRef {
  const nonNull = new TypeRef();
  const list = new TypeRef();
  const tr = new TypeRef();
  nonNull.setNonnull(list);
  list.setList(tr);
  tr.setName('SomeType');
  return nonNull;
}

const setReturnType = (v: { setReturntype(tr: TypeRef): void }): void => v.setReturntype(newExpectedTypeRef());

const expectedResponsePath = {
  prev: {
    prev: {
      key: 'someArray',
    },
    key: 1,
  },
  key: 'key',
};
function newExpectedResponsePath(path: (number | string)[]): ResponsePath | undefined {
  const last = path.splice(-1, 1)[0];
  if (!last) {
    return;
  }
  const rp = new ResponsePath();
  if (typeof last === 'string') {
    rp.setKey(stringValue(last));
  } else if (typeof last === 'number') {
    rp.setKey(intValue(last));
  }
  const prev = newExpectedResponsePath(path);
  if (prev) {
    rp.setPrev(prev);
  }
  return rp;
}
const setPath = (v: { setPath(rp: ResponsePath): void }): void =>
  v.setPath(newExpectedResponsePath(['someArray', 1, 'key']));

const expectedVariableValues = {
  variable: 'value',
};
const setVariableValues = (v: { getVariablevaluesMap(): jspb.Map<string, Value> }): jspb.Map<string, Value> =>
  v.getVariablevaluesMap().set('variable', stringValue('value'));

const expectedInfo = {
  fieldName: 'field',
  operation: expectedOperation,
  parentType: expectedParentTypeRef,
  returnType: expectedTypeRef,
  path: expectedResponsePath,
  variableValues: expectedVariableValues,
};
function setInfo<T extends FieldResolveInfo | InterfaceResolveTypeInfo | UnionResolveTypeInfo>(
  infoCtor: {
    new (): T;
  },
  req: {
    setInfo(info: T);
  },
): void {
  const info = new infoCtor();
  info.setFieldname('field');
  setOperation(info);
  setParentType(info);
  setReturnType(info);
  setPath(info);
  setVariableValues(info);
  req.setInfo(info);
}

const expectedProtocol = {
  headers: {
    HTTP_HEADER: ['value'],
  },
};
const setProtocol = (req: FieldResolveRequest): void =>
  req.setProtocol(
    objValue({
      headers: objValue({
        HTTP_HEADER: arrValue([stringValue('value')]),
      }),
    }),
  );

const expectedArguments = {
  stringArg: 'value',
  variableArg: 'value',
  defaultVariableArg: 'defaultValue',
};
const setArguments = (v: { getArgumentsMap(): jspb.Map<string, Value> }): void =>
  ([
    ['stringArg', stringValue('value')],
    ['variableArg', variableValue('variable')],
    ['defaultVariableArg', variableValue('defaultVariable')],
  ] as Array<[string, Value]>).forEach((arg) => {
    v.getArgumentsMap().set(arg[0], arg[1]);
  });

const expectedSource: {
  some: {
    source: [string, string, string, number, string];
  };
} = {
  some: {
    source: ['with', 'array', 'of', 5, 'elements'],
  },
};

function setSource(v: { setSource(source: Value) }): void {
  v.setSource(
    objValue({
      some: objValue({
        source: arrValue([
          stringValue(expectedSource.some.source[0]),
          stringValue(expectedSource.some.source[1]),
          stringValue(expectedSource.some.source[2]),
          intValue(expectedSource.some.source[3]),
          stringValue(expectedSource.some.source[4]),
        ]),
      }),
    }),
  );
}

describe('protocol buffer-javascript bridge', () => {
  it('creates protocol buffer error from Error', () => {
    expect(makeProtoError(new Error('msg'))).toEqual(
      ((): ProtoError => {
        const protoErr = new ProtoError();
        protoErr.setMsg('msg');
        return protoErr;
      })(),
    );
  });
  it('creates protocol buffer error from not an object', () => {
    expect(makeProtoError('error')).toEqual(
      ((): ProtoError => {
        const protoErr = new ProtoError();
        protoErr.setMsg('unknown error');
        return protoErr;
      })(),
    );
  });
  it('creates protocol buffer error from null', () => {
    expect(makeProtoError(null)).toEqual(
      ((): ProtoError => {
        const protoErr = new ProtoError();
        protoErr.setMsg('unknown error');
        return protoErr;
      })(),
    );
  });
  describe('field resolve', () => {
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await fieldResolve(new FieldResolveRequest(), handler);
      const expectedResposne = new FieldResolveResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new FieldResolveRequest();
      request.setInfo(new FieldResolveInfo());
      const response = await fieldResolve(request, handler);
      const expectedResposne = new FieldResolveResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({});
      const expectedInput: FieldResolveInput = {
        info: expectedInfo,
        protocol: expectedProtocol,
        arguments: expectedArguments,
        source: expectedSource,
      };
      const request = new FieldResolveRequest();
      setInfo(FieldResolveInfo, request);
      setProtocol(request);
      setArguments(request);
      setSource(request);
      await fieldResolve(request, handler);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({
        response: 'mocked response',
        error: {
          message: 'mocked error',
        },
      });
      const request = new FieldResolveRequest();
      request.setInfo(new FieldResolveInfo());
      const response = await fieldResolve(request, handler);
      const expectedResposne = new FieldResolveResponse();
      expectedResposne.setResponse(stringValue('mocked response'));
      const expectedErr = new ProtoError();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses any response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue('data');
      const request = new FieldResolveRequest();
      request.setInfo(new FieldResolveInfo());
      const response = await fieldResolve(request, handler);
      const expectedResposne = new FieldResolveResponse();
      expectedResposne.setResponse(stringValue('data'));
      expect(response).toEqual(expectedResposne);
    });
    it('parses undefined response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new FieldResolveRequest();
      request.setInfo(new FieldResolveInfo());
      const response = await fieldResolve(request, handler);
      const expectedResposne = new FieldResolveResponse();
      expectedResposne.setResponse(nilValue());
      expect(response).toEqual(expectedResposne);
    });
  });
  describe('interface resolve type', () => {
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await interfaceResolveType(new InterfaceResolveTypeRequest(), handler);
      const expectedResposne = new InterfaceResolveTypeResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new InterfaceResolveTypeRequest();
      request.setInfo(new InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, handler);
      const expectedResposne = new InterfaceResolveTypeResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({});
      const expectedInput: InterfaceResolveTypeInput = {
        info: expectedInfo,
        value: 'some value',
      };
      const request = new InterfaceResolveTypeRequest();
      setInfo(FieldResolveInfo, request);
      request.setValue(stringValue('some value'));
      await interfaceResolveType(request, handler);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed type response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({
        type: 'MockedType',
        error: {
          message: 'mocked error',
        },
      });
      const request = new InterfaceResolveTypeRequest();
      request.setInfo(new InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, handler);
      const expectedResposne = new InterfaceResolveTypeResponse();
      const mockedTypeRef = new TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      const expectedErr = new ProtoError();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses string type', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue('MockedType');
      const request = new InterfaceResolveTypeRequest();
      request.setInfo(new InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, handler);
      const expectedResposne = new InterfaceResolveTypeResponse();
      const mockedTypeRef = new TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      expect(response).toEqual(expectedResposne);
    });
    it('requires type', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new InterfaceResolveTypeRequest();
      request.setInfo(new InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, handler);
      const expectedResposne = new InterfaceResolveTypeResponse();
      const expectedErr = new ProtoError();
      expectedErr.setMsg('type cannot be empty');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
  });
  describe('set secrets', () => {
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new SetSecretsRequest();
      const response = await setSecrets(request, handler);
      const expectedResposne = new SetSecretsResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('handles input', async () => {
      const expectedInput = {
        secrets: {
          SECRET: 'value',
        },
      };
      const secret = new Secret();
      secret.setKey('SECRET');
      secret.setValue('value');
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new SetSecretsRequest();
      request.setSecretsList([secret]);
      const response = await setSecrets(request, handler);
      const expectedResposne = new SetSecretsResponse();
      expect(response).toEqual(expectedResposne);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
  });
  describe('scalar parse', () => {
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new ScalarParseRequest();
      const response = await scalarParse(request, handler);
      const expectedResposne = new ScalarParseResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({});
      const expectedInput: ScalarParseInput = {
        value: 'some value',
      };
      const request = new ScalarParseRequest();
      request.setValue(stringValue('some value'));
      await scalarParse(request, handler);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed value response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({
        response: 'mocked value',
        error: {
          message: 'mocked error',
        },
      });
      const request = new ScalarParseRequest();
      const response = await scalarParse(request, handler);
      const expectedResposne = new ScalarParseResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      const expectedErr = new ProtoError();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses any value', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue('mocked value');
      const request = new ScalarParseRequest();
      const response = await scalarParse(request, handler);
      const expectedResposne = new ScalarParseResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      expect(response).toEqual(expectedResposne);
    });
    it('parses undefined value', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new ScalarParseRequest();
      const response = await scalarParse(request, handler);
      const expectedResposne = new ScalarParseResponse();
      expectedResposne.setValue(nilValue());
      expect(response).toEqual(expectedResposne);
    });
  });
  describe('scalar serialize', () => {
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new ScalarSerializeRequest();
      const response = await scalarSerialize(request, handler);
      const expectedResposne = new ScalarSerializeResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({});
      const expectedInput: ScalarSerializeInput = {
        value: 'some value',
      };
      const request = new ScalarSerializeRequest();
      request.setValue(stringValue('some value'));
      await scalarSerialize(request, handler);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed value response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({
        response: 'mocked value',
        error: {
          message: 'mocked error',
        },
      });
      const request = new ScalarSerializeRequest();
      const response = await scalarSerialize(request, handler);
      const expectedResposne = new ScalarSerializeResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      const expectedErr = new ProtoError();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses any value', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue('mocked value');
      const request = new ScalarSerializeRequest();
      const response = await scalarSerialize(request, handler);
      const expectedResposne = new ScalarSerializeResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      expect(response).toEqual(expectedResposne);
    });
    it('parses undefined value', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new ScalarSerializeRequest();
      const response = await scalarSerialize(request, handler);
      const expectedResposne = new ScalarSerializeResponse();
      expectedResposne.setValue(nilValue());
      expect(response).toEqual(expectedResposne);
    });
  });
  describe('union resolve type', () => {
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await unionResolveType(new UnionResolveTypeRequest(), handler);
      const expectedResposne = new UnionResolveTypeResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new UnionResolveTypeRequest();
      request.setInfo(new UnionResolveTypeInfo());
      const response = await unionResolveType(request, handler);
      const expectedResposne = new UnionResolveTypeResponse();
      const protoErr = new ProtoError();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({});
      const expectedInput: UnionResolveTypeInput = {
        info: expectedInfo,
        value: 'some value',
      };
      const request = new UnionResolveTypeRequest();
      setInfo(FieldResolveInfo, request);
      request.setValue(stringValue('some value'));
      await unionResolveType(request, handler);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed type response', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue({
        type: 'MockedType',
        error: {
          message: 'mocked error',
        },
      });
      const request = new UnionResolveTypeRequest();
      request.setInfo(new UnionResolveTypeInfo());
      const response = await unionResolveType(request, handler);
      const expectedResposne = new UnionResolveTypeResponse();
      const mockedTypeRef = new TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      const expectedErr = new ProtoError();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
    it('parses string type', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue('MockedType');
      const request = new UnionResolveTypeRequest();
      request.setInfo(new UnionResolveTypeInfo());
      const response = await unionResolveType(request, handler);
      const expectedResposne = new UnionResolveTypeResponse();
      const mockedTypeRef = new TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      expect(response).toEqual(expectedResposne);
    });
    it('requires type', async () => {
      const handler = jest.fn();
      handler.mockResolvedValue(undefined);
      const request = new UnionResolveTypeRequest();
      request.setInfo(new UnionResolveTypeInfo());
      const response = await unionResolveType(request, handler);
      const expectedResposne = new UnionResolveTypeResponse();
      const expectedErr = new ProtoError();
      expectedErr.setMsg('type cannot be empty');
      expectedResposne.setError(expectedErr);
      expect(response).toEqual(expectedResposne);
    });
  });
});
