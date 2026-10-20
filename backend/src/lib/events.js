import { EventEmitter } from "events";

// Sunucu içi event yayını için paylaşılan emitter.
// Aynı anda birden fazla admin SSE bağlantısı açabilir, default 10 listener limiti dar gelebilir.
const bus = new EventEmitter();
// Her açık çekim listesi / admin sekmesi bir dinleyici ekler (yarışmada telefonlar + admin)
bus.setMaxListeners(200);

export default bus;
