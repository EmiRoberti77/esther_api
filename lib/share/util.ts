import { APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';

export function addCorsHeader(arg: APIGatewayProxyResult) {
  if (!arg.headers) {
    arg.headers = {};
  }
  arg.headers['Access-Control-Allow-Origin'] = '*';
  arg.headers['Access-Control-Allow-Methods'] = '*';
}

const DEFAULT_MSG = 'code not complete';

export enum TABLES {
  alarmTable = 'alaramuitable',
  statusTable = 'alarmstatustable',
}

export const ApigateWayProxyResult = (
  statusCode: number = 501,
  msg: any = DEFAULT_MSG
): APIGatewayProxyResult => {
  return {
    statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};

export const createId = (): string => {
  return randomUUID();
};
