'use strict';

class LedgerRepository {
  constructor(database) {
    if (!database) {
      throw new TypeError(
        'DatabaseConnection is required.'
      );
    }

    this.database = database;
  }

  async collection() {
    return this.database.collection('ledger_entries');
  }

  async createMany(entries, { session } = {}) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new TypeError(
        'At least one ledger entry is required.'
      );
    }

    const collection = await this.collection();

    return collection.insertMany(
      entries,
      {
        session,
        ordered: true
      }
    );
  }

  async findByUser({
    userId,
    currency,
    limit = 50,
    before
  }) {
    const collection = await this.collection();

    const query = { userId };

    if (currency) {
      query.currency = currency;
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    return collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
      .toArray();
  }

  async findJournalByReference(
    reference,
    { session } = {}
  ) {
    const db = await this.database.connect();

    return db.collection('ledger_journals').findOne(
      { reference },
      { session }
    );
  }

  async findEntriesByJournalId(
    journalId,
    { session } = {}
  ) {
    const collection = await this.collection();

    return collection
      .find(
        { journalId },
        { session }
      )
      .sort({ direction: 1 })
      .toArray();
  }

  async findByReference(reference) {
    const collection = await this.collection();

    return collection
      .find({ reference })
      .sort({ createdAt: 1 })
      .toArray();
  }

  async sumForUser({
    userId,
    currency = 'NGN',
    session
  }) {
    const collection = await this.collection();

    const result = await collection.aggregate(
      [
        {
          $match: {
            userId,
            currency
          }
        },
        {
          $group: {
            _id: '$direction',
            total: { $sum: '$amountMinor' }
          }
        }
      ],
      { session }
    ).toArray();

    const totals = {
      credits: 0,
      debits: 0
    };

    for (const row of result) {
      if (row._id === 'CREDIT') {
        totals.credits = row.total;
      }

      if (row._id === 'DEBIT') {
        totals.debits = row.total;
      }
    }

    return {
      creditsMinor: totals.credits,
      debitsMinor: totals.debits,
      balanceMinor: totals.credits - totals.debits
    };
  }
}

module.exports = LedgerRepository;
