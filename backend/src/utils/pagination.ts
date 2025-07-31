export function parseCursor(cursor?: string) {
    return cursor ? parseInt(cursor, 10) : Date.now(); 
  }