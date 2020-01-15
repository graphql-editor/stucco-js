export enum MessageType {
  FIELD_RESOLVE_REQUEST,
  FIELD_RESOLVE_RESPONSE,
  INTERFACE_RESOLVE_TYPE_REQUEST,
  INTERFACE_RESOLVE_TYPE_RESPONSE,
  SET_SECRETS_REQUEST,
  SET_SECRETS_RESPONSE,
  SCALAR_PARSE_REQUEST,
  SCALAR_PARSE_RESPONSE,
  SCALAR_SERIALIZE_REQUEST,
  SCALAR_SERIALIZE_RESPONSE,
  UNION_RESOLVE_TYPE_REQUEST,
  UNION_RESOLVE_TYPE_RESPONSE,
}

const protobufContentType = 'application/x-protobuf';

interface MIME {
  mimeType: string;
  params: {
    [k: string]: string | undefined;
  };
}

export function parseMIME(mime: string): MIME | undefined {
  mime = mime.trim();
  const parts = mime.split(/;[ ]*/);
  if (parts.length < 1 || !parts[0].match(/^[a-z-]*\/[a-z-]*$/)) {
    return;
  }
  const parsedMime: MIME = {
    mimeType: parts[0].toLowerCase(),
    params: {},
  };
  parts.slice(1).forEach((param) => {
    const split = param.indexOf('=');
    parsedMime.params[param.slice(0, split)] = split === -1 ? undefined : param.slice(split + 1);
  });
  return parsedMime;
}

function isProtobufMessage(mime?: MIME): mime is MIME {
  return !!mime && mime.mimeType === protobufContentType;
}

export function getMessageType(mime?: MIME): MessageType | undefined {
  if (!isProtobufMessage(mime)) {
    return;
  }
  let messageType: MessageType | undefined;
  switch ((mime.params.message || '').toLowerCase()) {
    case 'fieldresolverequest':
      messageType = MessageType.FIELD_RESOLVE_REQUEST;
      break;
    case 'fieldresolveresponse':
      messageType = MessageType.FIELD_RESOLVE_RESPONSE;
      break;
    case 'interfaceresolvetyperequest':
      messageType = MessageType.INTERFACE_RESOLVE_TYPE_REQUEST;
      break;
    case 'interfaceresolvetyperesponse':
      messageType = MessageType.INTERFACE_RESOLVE_TYPE_RESPONSE;
      break;
    case 'setsecretsrequest':
      messageType = MessageType.SET_SECRETS_REQUEST;
      break;
    case 'setsecretsresponse':
      messageType = MessageType.SET_SECRETS_RESPONSE;
      break;
    case 'scalarparserequest':
      messageType = MessageType.SCALAR_PARSE_REQUEST;
      break;
    case 'scalarparseresponse':
      messageType = MessageType.SCALAR_PARSE_RESPONSE;
      break;
    case 'scalarserializerequest':
      messageType = MessageType.SCALAR_SERIALIZE_REQUEST;
      break;
    case 'scalarserializeresponse':
      messageType = MessageType.SCALAR_SERIALIZE_RESPONSE;
      break;
    case 'unionresolvetyperequest':
      messageType = MessageType.UNION_RESOLVE_TYPE_REQUEST;
      break;
    case 'unionresolvetyperesponse':
      messageType = MessageType.UNION_RESOLVE_TYPE_RESPONSE;
      break;
  }
  return messageType;
}
