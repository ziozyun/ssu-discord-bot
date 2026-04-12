const MAX_DISPATCH_CACHE_SIZE = 1000;

function pruneDispatchCache(dispatchedNotificationKeys) {
  if (dispatchedNotificationKeys.size <= MAX_DISPATCH_CACHE_SIZE) {
    return;
  }

  const keysToDelete = dispatchedNotificationKeys.size - MAX_DISPATCH_CACHE_SIZE;
  let deletedKeys = 0;

  for (const key of dispatchedNotificationKeys.keys()) {
    dispatchedNotificationKeys.delete(key);
    deletedKeys += 1;

    if (deletedKeys >= keysToDelete) {
      return;
    }
  }
}

module.exports = {
  MAX_DISPATCH_CACHE_SIZE,
  pruneDispatchCache,
};
