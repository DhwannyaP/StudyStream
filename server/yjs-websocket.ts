import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import { IncomingMessage } from "http";

interface YjsWebSocket extends WebSocket {
  docName?: string;
  doc?: Y.Doc;
}

export class YjsWebSocketServer {
  private wss: WebSocketServer;
  private docs: Map<string, Y.Doc> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: "/yjs",
    });

    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on("connection", (ws: YjsWebSocket, req: IncomingMessage) => {
      console.log("Y.js WebSocket client connected");

      // Extract document name from URL
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const docName = url.searchParams.get("doc") || "default";

      ws.docName = docName;

      // Get or create Y.Doc for this document
      let doc = this.docs.get(docName);
      if (!doc) {
        doc = new Y.Doc();
        this.docs.set(docName, doc);
        console.log(`Created new Y.Doc for: ${docName}`);
      }

      ws.doc = doc;

      // Handle incoming messages
      ws.on("message", (message: Buffer) => {
        try {
          const messageType = message[0];

          switch (messageType) {
            case 0: // Sync step 1
            case 1: // Sync step 2
            case 2: // Update
              if (doc) {
                // Forward the message to all other clients connected to this document
                this.broadcastToDocument(docName, message, ws);
              }
              break;
            default:
              console.log("Unknown Y.js message type:", messageType);
          }
        } catch (error) {
          console.error("Error handling Y.js message:", error);
        }
      });

      // Send initial sync to the new client
      if (doc) {
        const syncMessage = Y.encodeStateAsUpdate(doc);
        if (syncMessage.length > 0) {
          const message = Buffer.concat([Buffer.from([0]), syncMessage]);
          ws.send(message);
        }
      }

      ws.on("close", () => {
        console.log(`Y.js WebSocket client disconnected from doc: ${docName}`);
      });

      ws.on("error", (error) => {
        console.error("Y.js WebSocket error:", error);
      });
    });
  }

  private broadcastToDocument(
    docName: string,
    message: Buffer,
    sender: YjsWebSocket
  ) {
    this.wss.clients.forEach((client: YjsWebSocket) => {
      if (
        client !== sender &&
        client.readyState === WebSocket.OPEN &&
        client.docName === docName
      ) {
        client.send(message);
      }
    });
  }

  public getDocument(docName: string): Y.Doc | undefined {
    return this.docs.get(docName);
  }

  public createDocument(docName: string): Y.Doc {
    const doc = new Y.Doc();
    this.docs.set(docName, doc);
    return doc;
  }

  public deleteDocument(docName: string): boolean {
    const doc = this.docs.get(docName);
    if (doc) {
      doc.destroy();
      this.docs.delete(docName);
      return true;
    }
    return false;
  }

  public getConnectedClients(docName: string): number {
    let count = 0;
    this.wss.clients.forEach((client: YjsWebSocket) => {
      if (client.readyState === WebSocket.OPEN && client.docName === docName) {
        count++;
      }
    });
    return count;
  }

  public close() {
    this.wss.close();
    this.docs.forEach((doc) => doc.destroy());
    this.docs.clear();
  }
}

