// 10. src/finance/database/AuditRepository.js

const crypto = require("crypto");
const Database = require("./Database");

class AuditRepository {
  constructor() {
    this.collection = "audits";
  }

  create(data) {
    const audit = {
      id: crypto.randomUUID(),
      userId: data.userId || null,
      action: data.action || "unknown",
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      status: data.status || "success",
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString()
    };

    return Database.insert(this.collection, audit);
  }

  findById(auditId) {
    return Database.findOne(
      this.collection,
      audit => audit.id === auditId
    );
  }

  findByUserId(userId) {
    return Database.findMany(
      this.collection,
      audit => audit.userId === userId
    );
  }

  findByResource(resource, resourceId) {
    return Database.findMany(
      this.collection,
      audit =>
        audit.resource === resource &&
        audit.resourceId === resourceId
    );
  }

  findByAction(action) {
    return Database.findMany(
      this.collection,
      audit => audit.action === action
    );
  }

  findAll() {
    return Database.findMany(this.collection);
  }
}

module.exports = new AuditRepository();
