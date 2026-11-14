import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { config } from '../config/env.js';

const docs = new Map();

export function setupYjs(wss) {
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://localhost:${config.wsPort}`);
    const docName = url.searchParams.get('docId') || 'default';
    
    let doc = docs.get(docName);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(docName, doc);
    }

    setupWSConnection(ws, req, { docName: docName, doc: doc });

    console.log(`Yjs document connected: ${docName}`);
  });

  setInterval(() => {
    for (const [name, doc] of docs) {
      if (doc.transactions.length === 0 && doc.getStateVector().length > 0) {
        console.log(`Persisting document: ${name}`);
      }
    }
  }, 60000);
}

export function getDocument(docName) {
  return docs.get(docName);
}

export function createDocument(docName) {
  if (!docs.has(docName)) {
    docs.set(docName, new Y.Doc());
  }
  return docs.get(docName);
}