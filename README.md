# C42-simple-cache

Simple and light `cache` component designed to allow to cache big objects without comparison.

The simple cache concept borns from the need of caching objects that are really expensive to compare. So the invalidation of a cache is done through `key invalidators`.

In this way, the system where the cache is being used is responsible of the maintenance of the cached objects as to invalidate them where an external factor required of a refresh of that cache.

## Documentation

> All snippets in this documentation are based in one user case, caching events for a certain user.

#### Caching

The process of caching an object starts with adding it in the cache, defining the keys will invalidate this object:

``` javascript
C42.SimpleCache.add({
    "cachedObjectName" : "Event_123",
    "cacheInvalidators" : ["Event_123", "user_events"],
    "cache": {
      "eventTitle": "Title of the event",
      "comment":"The comment"
    }
});
```

Where:

**cachedObjectName**: Identifier of the cached object, if is already there it will be replaced.

**cacheInvalidators**: List of keys can be used to invalidate the cached object. This example shows a cached object that can be invalidated with 2 different keys.

`cacheInvalidators` can be shared between cached objects, and all them will be invalidated when the invalidator is used.

**cache**: The object to cache. Apparently a really expensive to compare object.

### Getting the cached object

The cached object can be recovered by key:

``` javascript
var event = C42.SimpleCache.get("Event_123");
```

If the object is not there or is invalid, `event === undefined`.

#### Invalidating the cached object

The purpose of the **C42-simple-cache** is to provide of a really performed way to cache complex objects. Sending any of the cacheInvalidators as a param to the invalidate method will invalidate the cache.

``` javascript
C42.SimpleCache.invalidate("Event_123");
```
or
``` javascript
C42.SimpleCache.invalidate("user_events");
```

> Depending on the reason of the invalidation, different key will invalidate the same object.

#### Example result

In the example above is a common usage for this cache, so a `event` is invalidated when the event itself is updated:

> the cache is invalidated using it's id: **Event_123**

And when the list of user events is updated:

> the cache is invalidated using it's id: **user_events**

In the example, the `cacheInvalidators` is a shared key fro **all** events of the user. In this way, all events of the user will be refreshed either when the list changes or the user changes.

And meanwhile, the expensive operation is avoided and only the cace is being used to recover the complex object, in this case, an event.
