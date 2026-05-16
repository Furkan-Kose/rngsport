import { EventEmitter } from "events";

// Sunucu içi event yayını için paylaşılan emitter.
// Aynı anda birden fazla admin SSE bağlantısı açabilir, default 10 listener limiti dar gelebilir.
const bus = new EventEmitter();
bus.setMaxListeners(50);

export default bus;
