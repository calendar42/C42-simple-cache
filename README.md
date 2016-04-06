# C42-simple-cache

Simple and light `cache` component designed to allow to cache big objects without comparison.

The simple cache concept borns from the need of caching objects that are really expensive to compare. So the invalidation of a cache is done through `key invalidators`.

In this way, the system where the cache is being used is responsible of the maintenance of the cached objects as to invalidate them where an external factor required of a refresh of that cache.

## Prerequisites

None, this is a stand-alone component.

## Installation

1. Insert the file into your project.
1. Reference to it.
1. Use as in the example below.

## Usage

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

##### Example result

In the example above is a common usage for this cache, so a `event` is invalidated when the event itself is updated:

> the cache is invalidated using it's id: **Event_123**

And when the list of user events is updated:

> the cache is invalidated using it's id: **user_events**

In the example, the `cacheInvalidators` is a shared key fro **all** events of the user. In this way, all events of the user will be refreshed either when the list changes or the user changes.

And meanwhile, the expensive operation is avoided and only the cace is being used to recover the complex object, in this case, an event.

## API Reference

### add
---
Adds a new object to cache.

##### Parameters:

* cacheSetup: `{object}` A cached object setup. The expected format is the following:
```
{
      "cachedObjectName"  {string} The key name to identify the cached object
      "cacheInvalidators" {array} The list of invalidators keys will invalidate the provided cached object
      "cache": {object/string/...} Anything, the element to be cached
}
```

##### Return

* Boolean: True if the object is added successfully.

### update

---
Updates the cached object, as it's invalidators.

##### Parameters:

* cacheSetup: `{object}` A cached object setup. The expected format is the following:
```
{
      "cachedObjectName"  {string} The key name to identify the cached object
      "cacheInvalidators" {array} The list of invalidators keys will invalidate the provided cached object
      "cache": {object/string/...} Anything, the element to be cached
}
```

##### Return

* Boolean: True if the object is updated successfully.

### remove
---
Removes a cached object.

##### Parameters

* cachedObjectName: `{string}` The key name of the cached object to remove.

##### Return

* Boolean: True if the object is removed successfully.

### invalidate
---
Invalidates all cached object that have the provided invalidator.

##### Parameters

* invalidator: `{string}` Invalidator key name.

##### Return

* Boolean: True if the object is invalidated successfully.

### get
---
Gets the requested cached object.

##### Parameters

* cachedObjectName: `{string}` The name used to store certain object in the cache.

##### Return

* cachedObject: `{anything}` The validated object.

### getAll
---
Gets an object containing all cached objects sorted by key.

##### Parameters

> None

##### Return

* cachedObjectsList: `{object}` An object with the following structure:

```
{
  "cachedObjectName1" : cachedObjectContent1,
  "cachedObjectName2" : cachedObjectContent2,
  ...
}
```
