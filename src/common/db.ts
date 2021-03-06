import * as dg from 'dgraph-js';
import grpc from 'grpc';
import createLogger from 'hyped-logger';
import config from '../config';
import { escapeString } from './escapeString';

const logger = createLogger();

export const schema = `
  type Author {
    deathdate: dateTime
    birthdate: dateTime
    name: string
    alias: [string]
    thumbnail: string
    xid: string
    source: string
  }

  type Text {
    url: string
    title: string
    authors: [Author]
    subject: [string]
    xid: string
    source: string
  }

  name: string @index(exact) .

  url: string @index(exact) .

  title: string @index(exact) .

  subject: [string] .

  alias: [string] @index(term) .

  authors: [uid] @reverse @count .

  xid: string @index(exact) .

  source: string @index(exact) .
`;

export function createClient() {
  const clientStub = new dg.DgraphClientStub(
    `${config.get('DGRAPH_HOST')}:${config.get('DGRAPH_PORT')}`,
    grpc.credentials.createInsecure()
  );

  return new dg.DgraphClient(clientStub);
}

export async function init(client: dg.DgraphClient): Promise<void> {
  const operation = new dg.Operation();

  operation.setSchema(schema);

  try {
    await client.alter(operation);

    logger.debug(`Dgraph schema was successfully alterered`);
  } catch (err) {
    logger.error(`Could't alter database schema, error: ${err}`);

    throw err;
  }
}

// Drop all data including schema from the Dgraph instance. This is useful
// for small examples such as this, since it puts Dgraph into a clean
// state.
export async function dropGraphAndSchema(client: dg.DgraphClient): Promise<void> {
  const operation = new dg.Operation();

  operation.setDropAll(true);

  try {
    await client.alter(operation);

    logger.debug(`Dgraph schema was dropped, data - removed`);
  } catch (err) {
    logger.error(`Could't drop database, error: ${err}`);

    throw err;
  }
}

export async function deleteNodes(client: dg.DgraphClient, ids: string[]): Promise<string[]> {
  const mutation = new dg.Mutation();

  mutation.setDelNquads(ids.map((id: string) => `<${escapeString(id)}> * * .`).join('\n'));

  const txn = client.newTxn();

  try {
    await txn.mutate(mutation);

    await txn.commit();

    return ids;
  } catch (err) {
    if (err === dg.ERR_ABORTED) {
      return deleteNodes(client, ids);
    } else {
      logger.error(`Couldn't delete nodes, error: ${err}`);

      throw err;
    }
  } finally {
    await txn.discard();
  }
}
