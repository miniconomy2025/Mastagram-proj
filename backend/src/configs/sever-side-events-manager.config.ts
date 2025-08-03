import type { Response } from 'express';

export default class SeverSideEventsManager<T> {
  private clients = new Map<string, Response>();

  addClient(username: string, res: Response): void {
    this.clients.set(username, res);
  }

  removeClient(username: string): void {
    this.clients.delete(username);
  }

  sendToUser(username: string, data: T): void {
    const res = this.clients.get(username);
    if (res) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  hasClient(username: string): boolean {
    return this.clients.has(username);
  }

  clearAll(): void {
    this.clients.clear();
  }
}
