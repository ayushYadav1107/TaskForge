// Tiny zero-dependency embedded database.
//
// better-sqlite3 / node-gyp based drivers need a native toolchain to
// compile, which isn't guaranteed on every machine this project gets
// cloned onto. This store gives the app the same table/row/auto-increment
// shape (matching server/db/schema.sql) backed by a single JSON file, with
// no native compilation step required.

const fs = require("fs");
const path = require("path");
const config = require("../config");

const TABLES = [
  "users",
  "departments",
  "employees",
  "tasks",
  "task_assignments",
  "activity_logs",
];

function emptyData() {
  const data = { meta: { nextId: {} } };
  for (const table of TABLES) {
    data[table] = [];
    data.meta.nextId[table] = 1;
  }
  return data;
}

class JsonStore {
  constructor(file) {
    this.file = file;
    this._load();
  }

  _load() {
    if (!fs.existsSync(this.file)) {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      this.data = emptyData();
      this._save();
    } else {
      this.data = JSON.parse(fs.readFileSync(this.file, "utf-8"));
      for (const table of TABLES) {
        if (!this.data[table]) this.data[table] = [];
        if (!this.data.meta.nextId[table]) this.data.meta.nextId[table] = 1;
      }
    }
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  table(name) {
    if (!TABLES.includes(name)) throw new Error(`Unknown table: ${name}`);
    const self = this;
    return {
      all() {
        return self.data[name].slice();
      },
      find(id) {
        return self.data[name].find((row) => row.id === Number(id)) || null;
      },
      findOne(predicate) {
        return self.data[name].find(predicate) || null;
      },
      filter(predicate) {
        return self.data[name].filter(predicate);
      },
      insert(row) {
        const id = self.data.meta.nextId[name]++;
        const record = Object.assign({ id }, row);
        self.data[name].push(record);
        self._save();
        return record;
      },
      update(id, patch) {
        const idx = self.data[name].findIndex((row) => row.id === Number(id));
        if (idx === -1) return null;
        self.data[name][idx] = Object.assign({}, self.data[name][idx], patch, {
          id: self.data[name][idx].id,
        });
        self._save();
        return self.data[name][idx];
      },
      remove(id) {
        const idx = self.data[name].findIndex((row) => row.id === Number(id));
        if (idx === -1) return false;
        self.data[name].splice(idx, 1);
        self._save();
        return true;
      },
      removeWhere(predicate) {
        const before = self.data[name].length;
        self.data[name] = self.data[name].filter((row) => !predicate(row));
        self._save();
        return before - self.data[name].length;
      },
    };
  }

  reset() {
    this.data = emptyData();
    this._save();
  }
}

module.exports = new JsonStore(config.dbFile);
