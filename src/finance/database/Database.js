// 1. src/finance/database/Database.js

const fs = require("fs");
const path = require("path");

class Database {
  constructor() {
    this.dataDirectory = path.join(__dirname, "data");
    this.databaseFile = path.join(this.dataDirectory, "database.json");

    this.ensureDatabase();
  }

  ensureDatabase() {
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(this.databaseFile)) {
      const initialData = {
        users: [],
        wallets: [],
        balances: [],
        transactions: [],
        transfers: [],
        bankAccounts: [],
        withdrawals: [],
        payouts: [],
        exchanges: [],
        audits: []
      };

      fs.writeFileSync(
        this.databaseFile,
        JSON.stringify(initialData, null, 2),
        "utf8"
      );
    }
  }

  read() {
    this.ensureDatabase();

    const rawData = fs.readFileSync(this.databaseFile, "utf8");

    if (!rawData.trim()) {
      return {};
    }

    return JSON.parse(rawData);
  }

  write(data) {
    this.ensureDatabase();

    fs.writeFileSync(
      this.databaseFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return data;
  }

  getCollection(collectionName) {
    const data = this.read();

    if (!Array.isArray(data[collectionName])) {
      data[collectionName] = [];
      this.write(data);
    }

    return data[collectionName];
  }

  setCollection(collectionName, collection) {
    const data = this.read();

    data[collectionName] = collection;

    this.write(data);

    return collection;
  }

  insert(collectionName, document) {
    const collection = this.getCollection(collectionName);

    collection.push(document);

    this.setCollection(collectionName, collection);

    return document;
  }

  findOne(collectionName, predicate) {
    const collection = this.getCollection(collectionName);

    return collection.find(predicate) || null;
  }

  findMany(collectionName, predicate = () => true) {
    const collection = this.getCollection(collectionName);

    return collection.filter(predicate);
  }

  updateOne(collectionName, predicate, update) {
    const collection = this.getCollection(collectionName);

    const index = collection.findIndex(predicate);

    if (index === -1) {
      return null;
    }

    const current = collection[index];

    collection[index] = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString()
    };

    this.setCollection(collectionName, collection);

    return collection[index];
  }

  deleteOne(collectionName, predicate) {
    const collection = this.getCollection(collectionName);

    const index = collection.findIndex(predicate);

    if (index === -1) {
      return null;
    }

    const deleted = collection.splice(index, 1)[0];

    this.setCollection(collectionName, collection);

    return deleted;
  }

  clearCollection(collectionName) {
    this.setCollection(collectionName, []);

    return true;
  }
}

module.exports = new Database();
