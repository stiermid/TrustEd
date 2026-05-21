function anonymizeReviews(reviews, currentUserId, connections) {
  const connectedIds = new Set(
    connections.map(c =>
      c.requesterId === currentUserId ? c.receiverId : c.requesterId
    )
  );

  return reviews.map(({ user, ...review }) => ({
    ...review,
    author: review.userId === currentUserId || connectedIds.has(review.userId)
      ? user
      : null,
  }));
}

module.exports = { anonymizeReviews };
