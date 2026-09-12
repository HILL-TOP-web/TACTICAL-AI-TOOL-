/**
 * Vector Similarity
 * -----------------
 * Provides cosine similarity for local embeddings.
 */

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new TypeError(
      "Both vectors must be arrays."
    );
  }

  if (a.length !== b.length) {
    throw new Error(
      "Vectors must have the same dimensions."
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return Number(
    (
      dotProduct /
      (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
    ).toFixed(6)
  );
}

function rankBySimilarity(queryVector, documents) {
  if (!Array.isArray(documents)) {
    throw new TypeError(
      "Documents must be an array."
    );
  }

  return documents
    .map(document => ({
      ...document,
      similarity: cosineSimilarity(
        queryVector,
        document.embedding
      )
    }))
    .sort(
      (a, b) => b.similarity - a.similarity
    );
}

module.exports = {
  cosineSimilarity,
  rankBySimilarity
};
