// Author: Edmon Marine
// https://github.com/comlaterra
window.C42 = window.C42 || {};

C42.SimpleCache = function(){
    "use strict";

    // Note: the compressed version have debug = false.
    var debug = true;
    var logger = function(){
        return {
            log: function(){
                if(debug){
                    console.log.apply(console,arguments);
                }
            },
            warn: function(){
                if(debug){
                    console.warn.apply(console,arguments);
                }
            },
            error : function(){
                if(debug){
                    console.error.apply(console,arguments);
                }
            }
        };
    }();

    /**
     * Validates the basic cacheSetup. The ones should ALWAYS be there
     * @private
     * @param  {object} cacheSetup     The cacheSetup to be evaluated
     * @return {boolean}            True if the evaluated cacheSetup passes the evaluation
     */
    var validateOptions = function(cacheSetup){
        var me = "SimpleCache::validateOptions";
        // Required fields
        if (cacheSetup.cache === undefined){
            logger.warn(me + " : No cache. Required field");
            return false;
        }
        if (!cacheSetup.cachedObjectName){
            logger.warn(me + " : No cachedObjectName. Required field");
            return false;
        }
        if (!cacheSetup.cacheInvalidators){
            logger.warn(me + " : No cacheInvalidators. Required field");
            return false;
        }
        // Fields type
        if (typeof cacheSetup.cachedObjectName !== "string") {
            logger.warn(me + " : No valid cachedObjectName");
            return false;
        }
        if (!Array.isArray(cacheSetup.cacheInvalidators)) {
            logger.warn(me + " : No valid cacheInvalidators. Should be an Array");
            return false;
        }
        if (cacheSetup.cacheInvalidators.length === 0) {
            logger.warn(me + " : Empty cacheInvalidators. Not allowed to add a cached object without invalidators. To store data, use the store.");
            return false;
        }
        return true;
    };

    /**
     * Add invalidators to a certain object
     * @private
     * @param {string} cachedObjectName Name of the object the invalidators should be added
     * @param {array} invalidatorsList List of invalidators should be added for that cached object
     */
    var addInvalidators = function(cachedObjectName,invalidatorsList){
        var me = "SimpleCache::addInvalidators";
        var invalidator;
        // For performance, we need to keep the list of objects and it's invalidators up to date
        for (var i = invalidatorsList.length - 1; i >= 0; i--) {
            invalidator = invalidatorsList[i];

            if(invalidatorsMapping[invalidator] !== undefined){
                if(!invalidatorsMapping[invalidator].includes(cachedObjectName)){
                    invalidatorsMapping[invalidator].push(cachedObjectName);
                }
            }else{
                invalidatorsMapping[invalidator] = [cachedObjectName];
            }
        }
    };

    /**
     * Removes invalidators, all for a certain cached object, or the listed ones.
     * @private
     * @param  {string} cachedObjectName The name of the object affected for this removal
     * @param  {array} invalidatorsList  The list opf invalidators to remove
     */
    var removeObjectInvalidators = function(cachedObjectName,invalidatorsList){
        var me = "SimpleCache::removeObjectInvalidators";
        var invalidator;
        var objectPosition;
        // We only remove the objects that If we have a lits of onvalidators we only remove thoose
        if(invalidatorsList && invalidatorsList.length && invalidatorsList.length !== 0){
            for (var i = invalidatorsList.length - 1; i >= 0; i--) {
                invalidator = invalidatorsList[i];
                if(invalidatorsMapping[invalidator] !== undefined){
                    objectPosition = invalidatorsMapping[invalidator].indexOf(cachedObjectName);
                    if(objectPosition!==-1){
                        invalidatorsMapping[invalidator].splice(objectPosition,1);
                        if(invalidatorsMapping[invalidator].length === 0){
                            delete invalidatorsMapping[invalidator];
                        }
                    }
                }
            }
        // If we don't have the list of invalidators we remove all of them
        }else{
            var positionsToRemove = [];
            var invalidators = Object.keys(invalidatorsMapping);
            for(var y = 0; y < invalidators.length; y++){
                invalidator = invalidators[y];
                if(invalidatorsMapping[invalidator].includes(cachedObjectName)){
                    invalidatorsMapping[invalidator].splice(invalidatorsMapping[invalidator].indexOf(cachedObjectName),1);
                    if(invalidatorsMapping[invalidator].length === 0){
                        delete positionsToRemove[invalidator];
                    }
                }
            }
        }
    };

    /**
     * Updates the invalidators of a certain cached object.
     * @private
     * @param  {string} cachedObjectName The name of the object affected for this removal
     * @param  {array} cacheInvalidators  The list opf invalidators to remove
     */
    var updateInvalidators = function(cachedObjectName, cacheInvalidators){
      // For perfomance we are using mappings.
      var cacheInvalidator;
      var invalidatorsList = Object.keys(invalidatorsMapping);
      var invalidatorPosition;

      // Since it is an update, we don't remove all the invalidators,
      // we just remove the ones not in the invalidatorsList
      for(var i = 0; i< invalidatorsList.length; i++){
          invalidator = invalidatorsList[i];

          // This cache had an invalidator that now doesn't
          if (invalidatorsMapping[invalidator].includes(cachedObjectName)){
              if(!cacheInvalidators.includes(invalidator)){
                  invalidatorPosition = invalidatorsMapping[invalidator].indexOf(cachedObjectName);
                  invalidatorsMapping[invalidator].splice(invalidatorPosition,1);

                  // If, after removing the object from the invalidator, is empty, remove the invalidator key.
                  if(invalidatorsMapping[invalidator].length === 0){
                      delete invalidatorsMapping[invalidator];
                  }
              }
          }
      }

      // Adding the ivalidators
      var invalidatorName;
      for(var y = 0; y > cacheInvalidators.length; y++){
          invalidatorName = cacheInvalidators[y];
          if(!invalidatorsList.includes(invalidatorName)){
              invalidatorsMapping[invalidatorName] = [cachedObjectName];
          }else{
              if(!invalidatorsMapping[invalidatorName].includes(cachedObjectName)){
                  invalidatorsMapping[invalidatorName].push(cachedObjectName);
              }
          }
      }
    };

    // The cache itself
    var cache = [];
    // The list of keys the cache includes.
    // IMPORTANT: To be able to keep the performance of this component really high, this object is also used as
    // as a position mapping in the cache. If tou are modifying this component, please keep in mind this is a private opbject, for a reason ;)
    var cachedKeys = [];
    // Mapping between validators and objects are invelidating;
    // The expectede format is:
    // {
    //      "validatorName" : [objects_name]
    // }
    var invalidatorsMapping = {};

    /**
     * PUBLIC API
     */
    return {
        /**
         * Adds a new cache object
         * @param {object} cacheSetup The setup cache object. Expected format:
            {
                  "cachedObjectName"  {string} The key name to identify the cached object
                  "cacheInvalidators" {array} The list of invalidators keys will invalidate the provided cached object
                  "cache": {object/string/...} Anything, the elemtn to be cached
            }
            @return {boolean} true if set succesfully
         */
        add: function(cacheSetup){
            var me = "SimpleCache::set";
            if(!cacheSetup || !validateOptions(cacheSetup)){
                logger.error(me + " : No valid cacheSetup provided updating a chached object");
                return false;
            }

            if(cachedKeys.includes(cacheSetup.cachedObjectName)){
                logger.warn(me + " : Trying to add to the cache: '"+cacheSetup.cachedObjectName+"'. It is already cached.");
                return false;
            }

            cacheSetup.lastUpdate = new Date();
            cacheSetup.valid = true;

            // For performance we keep all invalidators registered and related to the objects we are caching
            addInvalidators(cacheSetup.cachedObjectName,cacheSetup.cacheInvalidators);

            cache.push(cacheSetup);

            // For performance we keep all cached objects keys listed in a mapping
            cachedKeys.push(cacheSetup.cachedObjectName);
            return true;
        },

        /**
         * Updates the cached object, as it's invalidators
         * @param {object} cacheSetup The setup cache object. Expected format:
            {
                  "cachedObjectName"  {string} The key nam0e to identify the cached object
                  "cacheInvalidators" {array} The list of invalidators keys will invalidate the provided cached object
                  "cache": {object/string/...} Anything, the elemtn to be cached
            }
         * @return {boolean} true if updated succesfully
         */
        update: function(cacheSetup){
            var me = "C42.SimpleCache::update";

            if(!cacheSetup || !validateOptions(cacheSetup)){
                logger.error(me + " : No valid cacheSetup provided updating a chached object");
                return false;
            }

            var cachePosition = cachedKeys.indexOf(cacheSetup.cachedObjectName);

            // For perfomance we use the indexOf to know if the object is actually cached and to get it's position
            if(cachePosition === -1){
                logger.error(me + " : Trying to update '"+cacheSetup.cachedObjectName+"'. It is not cached.");
                return false;
            }

            cacheSetup.lastUpdate = new Date();
            cacheSetup.valid = true;

            updateInvalidators(cacheSetup.cachedObjectName, cacheSetup.cacheInvalidators);

            cache[cachePosition] = cacheSetup;

            return true;
        },

        /**
         * Removes a cached object keeping up to date the indexes and invalidators
         * @param  {string} cachedObjectName The key name of the cached object
         * @return {boolean}                  True if removed succesfully
         */
        remove: function(cachedObjectName){
            var me = "SimpleCache::remove";

            if(!cachedKeys.includes(cachedObjectName)){
                logger.error(me + " : Trying to remove '"+cachedObjectName+"'. It is not cached.");
                return false;
            }
            var cachePosition = cachedKeys.indexOf(cachedObjectName);

            removeObjectInvalidators(cache[cachePosition].cachedObjectName, cache[cachePosition].cacheInvalidators);

            cache.splice(cachePosition,1);
            cachedKeys.splice(cachePosition,1);
            return true;
        },
        /**
         * Invalidates all cached object that have the provided invalidator.
         * @param  {string} invalidator Invalidator key name.
         * @return {boolean}             True if invalidated succesfully
         */
        invalidate: function(invalidator){
            var me = "SimpleCache::invalidate";

            var cacheToInvalidate;

            if(typeof invalidator === "string"){
                if(invalidatorsMapping[invalidator] === undefined){
                    logger.warn(me + " : Trying to invalidate with the '"+invalidator+"'. Not found");
                    return false;
                }
            }

            var invalidatedList = invalidatorsMapping[invalidator].slice(0);
            var invalidated;
            for(var y = 0; y < invalidatedList.length; y ++){
                invalidated = invalidatedList[y];

                if(!cachedKeys.includes(invalidated)){
                    logger.error(me + " : Trying to invalidator '"+invalidated+"'. It is not cached.");
                    return false;
                }

                var cachePosition = cachedKeys.indexOf(invalidated);

                cache.splice(cachePosition,1);
                cachedKeys.splice(cachePosition,1);

                // Remove the object from invalidators
                removeObjectInvalidators(invalidated);
            }

            return true;
        },

        /**
         * Get the cached object (content)
         * @param  {stringh} cachedObjectName The cached key name requested
         * @return {object}                  Object is object found, undefined if not
         */
        get: function(cachedObjectName){
            var me = "SimpleCache::get";
            var cachePosition = cachedKeys.indexOf(cachedObjectName);

            if(cachePosition !== undefined && cachePosition !== -1){
                if(cache[cachePosition].cachedObjectName === cachedObjectName){
                    return cache[cachePosition].cache;
                }else{
                    logger.error(me + " : Indexs are broken. Restart component is required;");
                }
            }
        },
        /**
         * Gets an object containing all cached objects sorted by keys
         * @return {object} Format:
         *  {
                "cachedObjectName1" : cachedObjectContent1,
                "cachedObjectName2" : cachedObjectContent2,
                ...
         }
         */
        getAll: function(){
            var me = "SimpleCache::getAll";
            var ret = {};
            for (var x = 0; x<cache.length; x++){
                ret[cache[x].cachedObjectName] = cache[x].cache;
            }
            return ret;
        }
        // Nice to have's:
        // validate: function(){},
        // addInvalidator: function(){},
        // removeObjectInvalidators: function(){}
    };
}();
