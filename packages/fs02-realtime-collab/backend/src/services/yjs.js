import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

const docs = new Map();

const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;

async function persistDocument(docId, doc) {
  try {
    const update = Y.encodeStateAsUpdate(doc);
    const buffer = Buffer.from(update);
    await prisma.document.upsert({
      where: { id: docId },
      update: {
        yjsDoc: buffer,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        id: docId,
        title: docId,
        content: {},
        yjsDoc: buffer,
        version: 1,
      },
    });
  } catch (err) {
    console.error(`Failed to persist document ${docId}:`, err.message);
  }
}

export function setupYjs(wss) {
  wss.on('connection', async (ws, req) => {
    let docId;
    let isUuid = false;
    let document = null;
    try {
      const url = new URL(req.url, `http://localhost:${config.wsPort}`);
      docId = url.searchParams.get('docId') || 'default';
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Missing authentication token');
        return;
      }

      let payload;
      try {
        payload = jwt.verify(token, config.jwt.secret);
      } catch {
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true },
      });
      if (!user) {
        ws.close(1008, 'User not found');
        return;
      }

      isUuid = UUID_REGEX.test(docId);
      if (isUuid) {
        document = await prisma.document.findUnique({
          where: { id: docId },
          include: {
            workspace: {
              include: { members: { select: { userId: true } } },
            },
          },
        });
        if (!document) {
          ws.close(1008, 'Document not found');
          return;
        }
        const isMember =
          document.workspace.members.some((m) => m.userId === user.id) ||
          document.workspace.ownerId === user.id ||
          document.ownerId === user.id;
        if (!isMember) {
          ws.close(1008, 'Access denied to document');
          return;
        }
      }

      const doc = docs.get(docId) || new Y.Doc();
      docs.set(docId, doc);

      if (document?.yjsDoc) {
        try {
          Y.applyUpdate(doc, new Uint8Array(document.yjsDoc));
        } catch {
          // ignore corrupt persisted state and start fresh
        }
      }

      setupWSConnection(ws, req, { docName: docId, doc });

      ws.on('close', () => {
        if (isUuid && document) {
          persistDocument(docId, doc);
        }
      });

      console.log(`Yjs document connected: ${docId} (user: ${user.id})`);
    } catch (err) {
      console.error('Yjs connection error:', err.message);
      try {
        ws.close(1011, 'Internal server error');
      } catch {
        // ignore
      }
    }
  });

  setInterval(() => {
    for (const [name, doc] of docs) {
      if (doc.transactions.length > 0) {
        persistDocument(name, doc);
      }
    }
  }, 30000);
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