import { parseMIME, getMessageType, MessageType, messageTypeToMime } from '../../src/raw/message.js';

describe('mime', () => {
  it('parsed', () => {
    const data: Array<{
      mime: string;
      expected?: ReturnType<typeof parseMIME>;
    }> = [
      {
        mime: '',
      },
      {
        mime: 'application/x-protobuf',
        expected: {
          mimeType: 'application/x-protobuf',
          params: {},
        },
      },
      {
        mime: 'application/x-protobuf;message=SomeParam',
        expected: {
          mimeType: 'application/x-protobuf',
          params: {
            message: 'SomeParam',
          },
        },
      },
      {
        mime: '  application/x-protobuf;   message=SomeParam   ',
        expected: {
          mimeType: 'application/x-protobuf',
          params: {
            message: 'SomeParam',
          },
        },
      },
      {
        mime: 'application/x-protobuf;message=SomeParam;someparam=SomeParam2',
        expected: {
          mimeType: 'application/x-protobuf',
          params: {
            message: 'SomeParam',
            someparam: 'SomeParam2',
          },
        },
      },
      {
        mime: 'application/x-protobuf;message',
        expected: {
          mimeType: 'application/x-protobuf',
          params: {
            message: undefined,
          },
        },
      },
    ];
    data.forEach((tc) => {
      expect(parseMIME(tc.mime)).toEqual(tc.expected);
    });
  });
});

describe('message type', () => {
  describe('from mime', () => {
    it('returns falsy for bad mime', () => {
      expect(getMessageType({ mimeType: 'application/json', params: {} })).toBeFalsy();
    });
    it('returns falsy for bad message', () => {
      expect(getMessageType({ mimeType: 'application/x-protobuf', params: {} })).toBeFalsy();
    });
    const mimeFor = (
      message: string,
    ): {
      mimeType: string;
      params: { [k: string]: string };
    } => {
      return {
        mimeType: 'application/x-protobuf',
        params: { message },
      };
    };
    it('returns correct enum for FieldResolveRequest', () => {
      expect(getMessageType(mimeFor('FieldResolveRequest'))).toEqual(MessageType.FIELD_RESOLVE_REQUEST);
    });
    it('returns correct enum for FieldResolveResponse', () => {
      expect(getMessageType(mimeFor('FieldResolveResponse'))).toEqual(MessageType.FIELD_RESOLVE_RESPONSE);
    });
    it('returns correct enum for InterfaceResolveTypeRequest', () => {
      expect(getMessageType(mimeFor('InterfaceResolveTypeRequest'))).toEqual(
        MessageType.INTERFACE_RESOLVE_TYPE_REQUEST,
      );
    });
    it('returns correct enum for InterfaceResolveTypeResponse', () => {
      expect(getMessageType(mimeFor('InterfaceResolveTypeResponse'))).toEqual(
        MessageType.INTERFACE_RESOLVE_TYPE_RESPONSE,
      );
    });
    it('returns correct enum for SetSecretsRequest', () => {
      expect(getMessageType(mimeFor('SetSecretsRequest'))).toEqual(MessageType.SET_SECRETS_REQUEST);
    });
    it('returns correct enum for SetSecretsResponse', () => {
      expect(getMessageType(mimeFor('SetSecretsResponse'))).toEqual(MessageType.SET_SECRETS_RESPONSE);
    });
    it('returns correct enum for ScalarParseRequest', () => {
      expect(getMessageType(mimeFor('ScalarParseRequest'))).toEqual(MessageType.SCALAR_PARSE_REQUEST);
    });
    it('returns correct enum for ScalarParseResponse', () => {
      expect(getMessageType(mimeFor('ScalarParseResponse'))).toEqual(MessageType.SCALAR_PARSE_RESPONSE);
    });
    it('returns correct enum for ScalarSerializeRequest', () => {
      expect(getMessageType(mimeFor('ScalarSerializeRequest'))).toEqual(MessageType.SCALAR_SERIALIZE_REQUEST);
    });
    it('returns correct enum for ScalarSerializeResponse', () => {
      expect(getMessageType(mimeFor('ScalarSerializeResponse'))).toEqual(MessageType.SCALAR_SERIALIZE_RESPONSE);
    });
    it('returns correct enum for UnionResolveTypeRequest', () => {
      expect(getMessageType(mimeFor('UnionResolveTypeRequest'))).toEqual(MessageType.UNION_RESOLVE_TYPE_REQUEST);
    });
    it('returns correct enum for UnionResolveTypeResponse', () => {
      expect(getMessageType(mimeFor('UnionResolveTypeResponse'))).toEqual(MessageType.UNION_RESOLVE_TYPE_RESPONSE);
    });
  });
  describe('to mime', () => {
    it('FieldResolveRequest message type', () => {
      expect(messageTypeToMime(MessageType.FIELD_RESOLVE_REQUEST)).toEqual(
        'application/x-protobuf;message=fieldresolverequest',
      );
    });
    it('FieldResolveResponse message type', () => {
      expect(messageTypeToMime(MessageType.FIELD_RESOLVE_RESPONSE)).toEqual(
        'application/x-protobuf;message=fieldresolveresponse',
      );
    });
    it('InterfaceResolveTypeRequest message type', () => {
      expect(messageTypeToMime(MessageType.INTERFACE_RESOLVE_TYPE_REQUEST)).toEqual(
        'application/x-protobuf;message=interfaceresolvetyperequest',
      );
    });
    it('InterfaceResolveTypeResponse message type', () => {
      expect(messageTypeToMime(MessageType.INTERFACE_RESOLVE_TYPE_RESPONSE)).toEqual(
        'application/x-protobuf;message=interfaceresolvetyperesponse',
      );
    });
    it('SetSecretsRequest message type', () => {
      expect(messageTypeToMime(MessageType.SET_SECRETS_REQUEST)).toEqual(
        'application/x-protobuf;message=setsecretsrequest',
      );
    });
    it('SetSecretsResponse message type', () => {
      expect(messageTypeToMime(MessageType.SET_SECRETS_RESPONSE)).toEqual(
        'application/x-protobuf;message=setsecretsresponse',
      );
    });
    it('ScalarParseRequest message type', () => {
      expect(messageTypeToMime(MessageType.SCALAR_PARSE_REQUEST)).toEqual(
        'application/x-protobuf;message=scalarparserequest',
      );
    });
    it('ScalarParseResponse message type', () => {
      expect(messageTypeToMime(MessageType.SCALAR_PARSE_RESPONSE)).toEqual(
        'application/x-protobuf;message=scalarparseresponse',
      );
    });
    it('ScalarSerializeRequest message type', () => {
      expect(messageTypeToMime(MessageType.SCALAR_SERIALIZE_REQUEST)).toEqual(
        'application/x-protobuf;message=scalarserializerequest',
      );
    });
    it('ScalarSerializeResponse message type', () => {
      expect(messageTypeToMime(MessageType.SCALAR_SERIALIZE_RESPONSE)).toEqual(
        'application/x-protobuf;message=scalarserializeresponse',
      );
    });
    it('UnionResolveTypeRequest message type', () => {
      expect(messageTypeToMime(MessageType.UNION_RESOLVE_TYPE_REQUEST)).toEqual(
        'application/x-protobuf;message=unionresolvetyperequest',
      );
    });
    it('UnionResolveTypeResponse message type', () => {
      expect(messageTypeToMime(MessageType.UNION_RESOLVE_TYPE_RESPONSE)).toEqual(
        'application/x-protobuf;message=unionresolvetyperesponse',
      );
    });
  });
});
