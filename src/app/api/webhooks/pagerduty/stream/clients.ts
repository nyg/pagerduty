import type { WebhookEvent } from "@/lib/types";

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients: SSEClient[] = [];

export function addSSEClient(client: SSEClient) {
  clients.push(client);
}

export function removeSSEClient(id: string) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx >= 0) clients.splice(idx, 1);
}

export function addSSEEvent(event: WebhookEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      // Client disconnected, will be cleaned up
    }
  }
}
