import { webcrypto } from 'node:crypto';

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = {
    userAgent: 'Node.js'
  } as any;
}

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as any;
}

if (!ArrayBuffer.prototype.transfer) {
  ArrayBuffer.prototype.transfer = function(newByteLength?: number) {
    const length = newByteLength ?? this.byteLength;
    const newBuffer = new ArrayBuffer(length);
    const sourceView = new Uint8Array(this);
    const targetView = new Uint8Array(newBuffer);
    const copyLength = Math.min(sourceView.length, targetView.length);
    for (let i = 0; i < copyLength; i++) {
      targetView[i] = sourceView[i];
    }
    return newBuffer;
  };
}

if (!ArrayBuffer.prototype.transferToFixedLength) {
  ArrayBuffer.prototype.transferToFixedLength = function(newByteLength: number) {
    if (newByteLength < 0) {
      throw new RangeError('Invalid array buffer length');
    }
    return this.transfer(newByteLength);
  };
}

Object.defineProperty(ArrayBuffer.prototype, 'buffer', {
  get: function() {
    return this;
  },
  configurable: true
});