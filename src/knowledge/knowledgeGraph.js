// knowledge/knowledgeGraph.js

class KnowledgeGraph {
  constructor() {
    this.entities = new Map();
    this.relationships = [];
  }

  addEntity(entity) {
    if (!entity || !entity.id) {
      throw new Error(
        "Entity must contain an id"
      );
    }

    const existing =
      this.entities.get(entity.id);

    this.entities.set(entity.id, {
      ...(existing || {}),
      ...entity,
      updatedAt:
        new Date().toISOString()
    });

    return this.entities.get(entity.id);
  }

  addRelationship(relationship) {
    if (
      !relationship ||
      !relationship.from ||
      !relationship.to ||
      !relationship.type
    ) {
      throw new Error(
        "Relationship requires from, to and type"
      );
    }

    const edge = {
      id:
        relationship.id ||
        `${relationship.from}-${relationship.type}-${relationship.to}`,
      ...relationship,
      createdAt:
        relationship.createdAt ||
        new Date().toISOString()
    };

    const exists =
      this.relationships.some(
        item => item.id === edge.id
      );

    if (!exists) {
      this.relationships.push(edge);
    }

    return edge;
  }

  getEntity(id) {
    return (
      this.entities.get(id) || null
    );
  }

  getRelationships(entityId) {
    return this.relationships.filter(
      relationship =>
        relationship.from === entityId ||
        relationship.to === entityId
    );
  }

  getNeighbors(entityId) {
    const relationships =
      this.getRelationships(entityId);

    const neighborIds =
      new Set();

    for (const relationship of relationships) {
      if (
        relationship.from === entityId
      ) {
        neighborIds.add(
          relationship.to
        );
      }

      if (
        relationship.to === entityId
      ) {
        neighborIds.add(
          relationship.from
        );
      }
    }

    return Array.from(
      neighborIds
    )
      .map(id =>
        this.getEntity(id)
      )
      .filter(Boolean);
  }

  searchEntities(query) {
    const normalized =
      String(query)
        .toLowerCase();

    return Array.from(
      this.entities.values()
    ).filter(entity => {
      const haystack =
        [
          entity.name,
          entity.type,
          entity.description,
          ...(entity.aliases || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      return haystack.includes(
        normalized
      );
    });
  }

  buildSubgraph(entityIds) {
    const ids =
      new Set(entityIds);

    const entities =
      Array.from(
        ids
      )
        .map(id =>
          this.getEntity(id)
        )
        .filter(Boolean);

    const relationships =
      this.relationships.filter(
        relationship =>
          ids.has(relationship.from) &&
          ids.has(relationship.to)
      );

    return {
      entities,
      relationships
    };
  }

  export() {
    return {
      entities:
        Array.from(
          this.entities.values()
        ),
      relationships:
        this.relationships
    };
  }

  import(graph) {
    if (!graph) {
      throw new Error(
        "Graph data is required"
      );
    }

    this.entities.clear();
    this.relationships = [];

    for (const entity of graph.entities || []) {
      this.addEntity(entity);
    }

    for (const relationship of graph.relationships || []) {
      this.addRelationship(
        relationship
      );
    }

    return this;
  }
}

module.exports = KnowledgeGraph;
