const Database = require("better-sqlite3");
const db = new Database("data/yummy.db");
const count = db.prepare("SELECT COUNT(*) as count FROM reviews").get();
console.log("Reviews before delete:", count.count);
db.prepare("DELETE FROM reviews").run();
const after = db.prepare("SELECT COUNT(*) as count FROM reviews").get();
console.log("Reviews after delete:", after.count);
db.close();
