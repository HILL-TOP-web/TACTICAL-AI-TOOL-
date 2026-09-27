// 11. src/finance/database/UserRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class UserRepository {
  constructor() {
    this.collection = "users";
  }

  create(data) {
    if (!data.fullName) {
      throw new Error("fullName is required");
    }

    if (!data.username) {
      throw new Error("username is required");
    }

    if (!data.email) {
      throw new Error("email is required");
    }

    const existingUsername = this.findByUsername(
      data.username
    );

    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const existingEmail = this.findByEmail(
      data.email
    );

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    const user = {
      id: crypto.randomUUID(),
      fullName: data.fullName,
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash || null,
      role: data.role || "user",
      status: data.status || "active",
      kycStatus: data.kycStatus || "not_verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return Database.insert(this.collection, user);
  }

  findById(userId) {
    return Database.findOne(
      this.collection,
      user => user.id === userId
    );
  }

  findByUsername(username) {
    return Database.findOne(
      this.collection,
      user => user.username === username
    );
  }

  findByEmail(email) {
    return Database.findOne(
      this.collection,
      user => user.email === email.toLowerCase()
    );
  }

  update(userId, updates) {
    return Database.updateOne(
      this.collection,
      user => user.id === userId,
      updates
    );
  }

  updateKycStatus(userId, kycStatus) {
    return this.update(userId, {
      kycStatus
    });
  }

  deactivate(userId) {
    return this.update(userId, {
      status: "inactive"
    });
  }

  activate(userId) {
    return this.update(userId, {
      status: "active"
    });
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new UserRepository();
