// Preloaded into the local backend by scripts/btc (via NODE_OPTIONS).
// The home router's DNS doesn't answer the SRV lookup a mongodb+srv:// URI
// needs (querySrv ETIMEOUT), so ask public DNS servers instead. Local dev
// only - Railway never loads this.
require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
