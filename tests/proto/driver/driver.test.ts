import { jest } from '@jest/globals';

import {
  makeProtoError,
  fieldResolve,
  interfaceResolveType,
  unionResolveType,
  scalarParse,
  scalarSerialize,
  setSecrets,
} from '../../../src/proto/driver/index.js';
import * as jspb from 'google-protobuf';
import * as messages from '../../../src/proto/driver/messages';
import {
  FieldResolveInput,
  InterfaceResolveTypeInput,
  InterfaceResolveTypeOutput,
  UnionResolveTypeInput,
  UnionResolveTypeOutput,
  ScalarParseInput,
  ScalarSerializeInput,
  SetSecretsInput,
  SetSecretsOutput,
} from '../../../src/api/index.js';
import { nilValue, stringValue, intValue, arrValue, objValue, variableValue } from './helpers.js';

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
function setSelections(v: { setSelectionsetList(s: Array<messages.Selection>): void }): void {
  const selections = [new messages.Selection(), new messages.Selection(), new messages.Selection()];

  const directives = [new messages.Directive()];
  directives[0].setName('@someDir');

  const subFieldSelection = [new messages.Selection()];
  subFieldSelection[0].setName('subField');

  selections[0].setName('field');
  selections[0].getArgumentsMap().set('arg', stringValue('value'));
  selections[0].setDirectivesList(directives);
  selections[0].setSelectionsetList(subFieldSelection);

  const definition = new messages.FragmentDefinition();

  const fragmentSelection = [new messages.Selection()];
  fragmentSelection[0].setName('field');

  const typeCondition = new messages.TypeRef();
  typeCondition.setName('SomeType');

  const variable = new messages.Variable();
  variable.setName('someVariable');
  const variableDefinitions = [new messages.VariableDefinition()];
  variableDefinitions[0].setDefaultvalue(stringValue('someValue'));
  variableDefinitions[0].setVariable(variable);

  const definitionDirectives = [new messages.Directive()];
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
const setVariabledefinitions = (v: {
  setVariabledefinitionsList(vars: Array<messages.VariableDefinition>): void;
}): void =>
  v.setVariabledefinitionsList(
    expectedVariableDefinitions.map((variable): messages.VariableDefinition => {
      const varDef = new messages.VariableDefinition();
      varDef.setDefaultvalue(stringValue(variable.defaultValue));
      const varName = new messages.Variable();
      varName.setName(variable.variable.name);
      varDef.setVariable(varName);
      return varDef;
    }),
  );

const expectedOperation = {
  operation: 'query',
  name: 'someOp',
  selectionSet: expectedSelections,
  variableDefinitions: expectedVariableDefinitions,
};
function setOperation(v: { setOperation(odef: messages.OperationDefinition): void }): void {
  const od = new messages.OperationDefinition();
  od.setOperation('query');
  od.setName('someOp');
  setSelections(od);
  setVariabledefinitions(od);
  v.setOperation(od);
}

const expectedParentTypeRef = {
  name: 'SomeType',
};
function setParentType(v: { setParenttype(tr: messages.TypeRef): void }): void {
  const tr = new messages.TypeRef();
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
function newExpectedTypeRef(): messages.TypeRef {
  const nonNull = new messages.TypeRef();
  const list = new messages.TypeRef();
  const tr = new messages.TypeRef();
  nonNull.setNonnull(list);
  list.setList(tr);
  tr.setName('SomeType');
  return nonNull;
}

const setReturnType = (v: { setReturntype(tr: messages.TypeRef): void }): void => v.setReturntype(newExpectedTypeRef());

const expectedResponsePath = {
  prev: {
    prev: {
      key: 'someArray',
    },
    key: 1,
  },
  key: 'key',
};
function newExpectedResponsePath(path: (number | string)[]): messages.ResponsePath | undefined {
  const last = path.splice(-1, 1)[0];
  if (!last) {
    return;
  }
  const rp = new messages.ResponsePath();
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
function assertDefined<T>(v?: T): T {
  if (!v) {
    throw new Error('is undefined');
  }
  return v;
}
const setPath = (v: { setPath(rp: messages.ResponsePath): void }): void =>
  v.setPath(assertDefined(newExpectedResponsePath(['someArray', 1, 'key'])));

const expectedVariableValues = {
  variable: 'value',
};
const setVariableValues = (v: {
  getVariablevaluesMap(): jspb.Map<string, messages.Value>;
}): jspb.Map<string, messages.Value> => v.getVariablevaluesMap().set('variable', stringValue('value'));

interface InfoLike {
  setFieldname(v: string): void;
  setOperation(odef: messages.OperationDefinition): void;
  setParenttype(tr: messages.TypeRef): void;
  setReturntype(tr: messages.TypeRef): void;
  setPath(rp: messages.ResponsePath): void;
  getVariablevaluesMap(): jspb.Map<string, messages.Value>;
}

const expectedInfo = {
  fieldName: 'field',
  operation: expectedOperation,
  parentType: expectedParentTypeRef,
  returnType: expectedTypeRef,
  path: expectedResponsePath,
  variableValues: expectedVariableValues,
};
function setInfo<T extends InfoLike & U, U>(
  infoCtor: {
    new (): T;
  },
  req: {
    setInfo(info: U): void;
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
const setProtocol = (req: messages.FieldResolveRequest): messages.FieldResolveRequest =>
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
const setArguments = (v: { getArgumentsMap(): jspb.Map<string, messages.Value> }): void =>
  (
    [
      ['stringArg', stringValue('value')],
      ['variableArg', variableValue('variable')],
      ['defaultVariableArg', variableValue('defaultVariable')],
    ] as Array<[string, messages.Value]>
  ).forEach((arg) => {
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

function setSource(v: { setSource: (source: messages.Value) => void }): void {
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
      ((): messages.Error => {
        const protoErr = new messages.Error();
        protoErr.setMsg('msg');
        return protoErr;
      })(),
    );
  });
  it('creates protocol buffer error from not an object', () => {
    expect(makeProtoError('error')).toEqual(
      ((): messages.Error => {
        const protoErr = new messages.Error();
        protoErr.setMsg('unknown error');
        return protoErr;
      })(),
    );
  });
  it('creates protocol buffer error from null', () => {
    expect(makeProtoError(null)).toEqual(
      ((): messages.Error => {
        const protoErr = new messages.Error();
        protoErr.setMsg('unknown error');
        return protoErr;
      })(),
    );
  });
  describe('field resolve', () => {
    type HandlerType = (x: FieldResolveInput<Record<string, unknown> | undefined, unknown>) => Promise<unknown>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await fieldResolve(new messages.FieldResolveRequest(), asHandler(handler));
      const expectedResposne = new messages.FieldResolveResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.FieldResolveRequest();
      request.setInfo(new messages.FieldResolveInfo());
      const response = await fieldResolve(request, asHandler(handler));
      const expectedResposne = new messages.FieldResolveResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve({}));
      const expectedInput: FieldResolveInput = {
        info: expectedInfo,
        protocol: expectedProtocol,
        arguments: expectedArguments,
        source: expectedSource,
      };
      const request = new messages.FieldResolveRequest();
      setInfo(messages.FieldResolveInfo, request);
      setProtocol(request);
      setArguments(request);
      setSource(request);
      await fieldResolve(request, asHandler(handler));
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() =>
        Promise.resolve({
          response: 'mocked response',
          error: {
            message: 'mocked error',
          },
        }),
      );
      const request = new messages.FieldResolveRequest();
      request.setInfo(new messages.FieldResolveInfo());
      const response = await fieldResolve(request, asHandler(handler));
      const expectedResposne = new messages.FieldResolveResponse();
      expectedResposne.setResponse(stringValue('mocked response'));
      const expectedErr = new messages.Error();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses any response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve('data'));
      const request = new messages.FieldResolveRequest();
      request.setInfo(new messages.FieldResolveInfo());
      const response = await fieldResolve(request, asHandler(handler));
      const expectedResposne = new messages.FieldResolveResponse();
      expectedResposne.setResponse(stringValue('data'));
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses undefined response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.FieldResolveRequest();
      request.setInfo(new messages.FieldResolveInfo());
      const response = await fieldResolve(request, asHandler(handler));
      const expectedResposne = new messages.FieldResolveResponse();
      expectedResposne.setResponse(nilValue());
      expect(response).toMatchObject(expectedResposne);
    });
  });
  describe('interface resolve type', () => {
    type HandlerType = (x: InterfaceResolveTypeInput) => Promise<InterfaceResolveTypeOutput | undefined>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await interfaceResolveType(new messages.InterfaceResolveTypeRequest(), asHandler(handler));
      const expectedResposne = new messages.InterfaceResolveTypeResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.InterfaceResolveTypeRequest();
      request.setInfo(new messages.InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, asHandler(handler));
      const expectedResposne = new messages.InterfaceResolveTypeResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve({}));
      const expectedInput: InterfaceResolveTypeInput = {
        info: expectedInfo,
        value: 'some value',
      };
      const request = new messages.InterfaceResolveTypeRequest();
      setInfo(messages.FieldResolveInfo, request);
      request.setValue(stringValue('some value'));
      await interfaceResolveType(request, asHandler(handler));
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed type response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() =>
        Promise.resolve({
          type: 'MockedType',
          error: {
            message: 'mocked error',
          },
        }),
      );
      const request = new messages.InterfaceResolveTypeRequest();
      request.setInfo(new messages.InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, asHandler(handler));
      const expectedResposne = new messages.InterfaceResolveTypeResponse();
      const mockedTypeRef = new messages.TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      const expectedErr = new messages.Error();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses string type', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve('MockedType'));
      const request = new messages.InterfaceResolveTypeRequest();
      request.setInfo(new messages.InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, asHandler(handler));
      const expectedResposne = new messages.InterfaceResolveTypeResponse();
      const mockedTypeRef = new messages.TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      expect(response).toMatchObject(expectedResposne);
    });
    it('requires type', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.InterfaceResolveTypeRequest();
      request.setInfo(new messages.InterfaceResolveTypeInfo());
      const response = await interfaceResolveType(request, asHandler(handler));
      const expectedResposne = new messages.InterfaceResolveTypeResponse();
      const expectedErr = new messages.Error();
      expectedErr.setMsg('type cannot be empty');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
  });
  describe('set secrets', () => {
    type HandlerType = (x: SetSecretsInput) => Promise<SetSecretsOutput>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.SetSecretsRequest();
      const response = await setSecrets(request, asHandler(handler));
      const expectedResposne = new messages.SetSecretsResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('handles input', async () => {
      const expectedInput = {
        secrets: {
          SECRET: 'value',
        },
      };
      const secret = new messages.Secret();
      secret.setKey('SECRET');
      secret.setValue('value');
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.SetSecretsRequest();
      request.setSecretsList([secret]);
      const response = await setSecrets(request, asHandler(handler));
      const expectedResposne = new messages.SetSecretsResponse();
      expect(response).toMatchObject(expectedResposne);
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
  });
  describe('scalar parse', () => {
    type HandlerType = (x: ScalarParseInput) => Promise<unknown>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.ScalarParseRequest();
      const response = await scalarParse(request, asHandler(handler));
      const expectedResposne = new messages.ScalarParseResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve({}));
      const expectedInput: ScalarParseInput = {
        value: 'some value',
      };
      const request = new messages.ScalarParseRequest();
      request.setValue(stringValue('some value'));
      await scalarParse(request, asHandler(handler));
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed value response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() =>
        Promise.resolve({
          response: 'mocked value',
          error: {
            message: 'mocked error',
          },
        }),
      );
      const request = new messages.ScalarParseRequest();
      const response = await scalarParse(request, asHandler(handler));
      const expectedResposne = new messages.ScalarParseResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      const expectedErr = new messages.Error();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses any value', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve('mocked value'));
      const request = new messages.ScalarParseRequest();
      const response = await scalarParse(request, asHandler(handler));
      const expectedResposne = new messages.ScalarParseResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses undefined value', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.ScalarParseRequest();
      const response = await scalarParse(request, asHandler(handler));
      const expectedResposne = new messages.ScalarParseResponse();
      expectedResposne.setValue(nilValue());
      expect(response).toMatchObject(expectedResposne);
    });
  });
  describe('scalar serialize', () => {
    type HandlerType = (x: ScalarSerializeInput) => Promise<unknown>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.ScalarSerializeRequest();
      const response = await scalarSerialize(request, asHandler(handler));
      const expectedResposne = new messages.ScalarSerializeResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve({}));
      const expectedInput: ScalarSerializeInput = {
        value: 'some value',
      };
      const request = new messages.ScalarSerializeRequest();
      request.setValue(stringValue('some value'));
      await scalarSerialize(request, asHandler(handler));
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed value response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() =>
        Promise.resolve({
          response: 'mocked value',
          error: {
            message: 'mocked error',
          },
        }),
      );
      const request = new messages.ScalarSerializeRequest();
      const response = await scalarSerialize(request, asHandler(handler));
      const expectedResposne = new messages.ScalarSerializeResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      const expectedErr = new messages.Error();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses any value', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve('mocked value'));
      const request = new messages.ScalarSerializeRequest();
      const response = await scalarSerialize(request, asHandler(handler));
      const expectedResposne = new messages.ScalarSerializeResponse();
      expectedResposne.setValue(stringValue('mocked value'));
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses undefined value', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.ScalarSerializeRequest();
      const response = await scalarSerialize(request, asHandler(handler));
      const expectedResposne = new messages.ScalarSerializeResponse();
      expectedResposne.setValue(nilValue());
      expect(response).toMatchObject(expectedResposne);
    });
  });
  describe('union resolve type', () => {
    type HandlerType = (x: UnionResolveTypeInput) => Promise<UnionResolveTypeOutput | undefined>;
    const asHandler = (v: unknown) => v as HandlerType;
    it('requires info', async () => {
      const handler = jest.fn();
      const response = await unionResolveType(new messages.UnionResolveTypeRequest(), asHandler(handler));
      const expectedResposne = new messages.UnionResolveTypeResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('info is required');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('handles error', async () => {
      const handler = jest.fn();
      handler.mockRejectedValue(new Error('mocked error'));
      const request = new messages.UnionResolveTypeRequest();
      request.setInfo(new messages.UnionResolveTypeInfo());
      const response = await unionResolveType(request, asHandler(handler));
      const expectedResposne = new messages.UnionResolveTypeResponse();
      const protoErr = new messages.Error();
      protoErr.setMsg('mocked error');
      expectedResposne.setError(protoErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses input', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve({}));
      const expectedInput: UnionResolveTypeInput = {
        info: expectedInfo,
        value: 'some value',
      };
      const request = new messages.UnionResolveTypeRequest();
      setInfo(messages.FieldResolveInfo, request);
      request.setValue(stringValue('some value'));
      await unionResolveType(request, asHandler(handler));
      expect(handler).toHaveBeenCalledWith(expectedInput);
    });
    it('parses formed type response', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() =>
        Promise.resolve({
          type: 'MockedType',
          error: {
            message: 'mocked error',
          },
        }),
      );
      const request = new messages.UnionResolveTypeRequest();
      request.setInfo(new messages.UnionResolveTypeInfo());
      const response = await unionResolveType(request, asHandler(handler));
      const expectedResposne = new messages.UnionResolveTypeResponse();
      const mockedTypeRef = new messages.TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      const expectedErr = new messages.Error();
      expectedErr.setMsg('mocked error');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
    it('parses string type', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve('MockedType'));
      const request = new messages.UnionResolveTypeRequest();
      request.setInfo(new messages.UnionResolveTypeInfo());
      const response = await unionResolveType(request, asHandler(handler));
      const expectedResposne = new messages.UnionResolveTypeResponse();
      const mockedTypeRef = new messages.TypeRef();
      mockedTypeRef.setName('MockedType');
      expectedResposne.setType(mockedTypeRef);
      expect(response).toMatchObject(expectedResposne);
    });
    it('requires type', async () => {
      const handler = jest.fn();
      handler.mockImplementation(() => Promise.resolve(undefined));
      const request = new messages.UnionResolveTypeRequest();
      request.setInfo(new messages.UnionResolveTypeInfo());
      const response = await unionResolveType(request, asHandler(handler));
      const expectedResposne = new messages.UnionResolveTypeResponse();
      const expectedErr = new messages.Error();
      expectedErr.setMsg('type cannot be empty');
      expectedResposne.setError(expectedErr);
      expect(response).toMatchObject(expectedResposne);
    });
  });
});
