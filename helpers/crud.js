var client = require('mongodb').MongoClient
  , ObjectID = require('mongodb').ObjectID;

// The global connection string shared throughout the application.
// This is however made private to the mongo-crud library. To alter
// use the CRUD.connect() method passing the new URL.
var URL = null;

// Creating a namespace for the crud operations.
var CRUD = CRUD || {};

/**
 * The create operation is used to add new documents to collections.
 * @param {string} collection The name of the target mongo collection.
 * @param {object} doc The document to be stored.
 * @param {function} callback The command result callback.
 * @return {null}
 */
var _create = CRUD.create = function (collection, doc, callback) {
  var collectionName = typeof collection === 'string' ? collection.toLowerCase() : null;

  // Check to see that the call to the connect function was made and if not abort operation.
  if (!URL) { 
    call(callback, new Error('Cannot perform CRUD operations until connect is called with a valid Mongo Server URI.' + URL));
  }
  else {
    if (!collectionName) {
      call(callback, new Error('No collection name specified.'));
    }
    else {
      client.connect(URL, {db: { bufferMaxEntries: 0 }}, function(err, db) {
        if (!err) {
          var collection = db.collection(collectionName);
          collection.insert(doc, function (err, result){
            db.close();
            call(callback, err, result);
          });
        }
        else {
          call(callback, err);
        }
      });
    }
  }

};

/**
 * Returns an array of documents from the collection that matches the criteria.
 * @param {string} collection The name of the target mongo collection.
 * @param {object} criteria The match criteria for the mongo where clause.
 * @param {function} callback The command result callback.
 * @return {null}
 */
var _retrieve = CRUD.retrieve = function (collection, criteria, callback) {
  var collectionName = typeof collection === 'string' ? collection.toLowerCase() : null
    , where = typeof criteria === 'function' ? {} : criteria
    , callback = typeof criteria === 'function' ? criteria : callback;

  if (!URL) {
    call(callback, new Error('Cannot perform CRUD operations until connect is called with a valid Mongo Server URI.' + URL));
  }
  else {
    if (!collectionName) {
      call(callback, new Error('No collection name specified.'));
    }
    else {
      client.connect(URL, function (err, db) {
        if (err) {
          call(callback,err);
        }
        else {
          var collection = db.collection(collectionName);
          collection.find(where).toArray(function (err, docs) {
            db.close();
            call(callback, err, docs);
          });
        }
      });
    }
  }
};

/**
 * The update operation is used to update a document from the specified collection. This method only
 * works to update whole documents. Document `_id` property must be included in the passed document to
 * help identify it.
 * @param {string} collection The name of the target mongo collection.
 * @param {object} criteria The document to be stored.
 * @param {function} callback The command result callback.
 * @return {null}
 */
var _update = CRUD.update = function (collection, criteria, callback) {
  var collectionName = typeof collection === 'string' ? collection.toLowerCase() : null
    , doc = typeof criteria === 'function' ? {} : criteria
    , callback = typeof criteria === 'function' ? criteria : callback;

  if (!URL) {
    call(callback, new Error('Cannot perform CRUD operations until connect is called with a valid Mongo Server URI.'));
  }
  else {
    if (!collectionName) {
      call(callback, new Error('No collection name specified.'));
    }
    else {
      // In the case of updating whole documents we must verify save and remove the _id
      // parameter from the document as it is illegal to attempt to update this.
      var id;
      if (doc.hasOwnProperty('_id')) {
        id = {_id: ObjectID(doc._id)}
        delete doc._id

        // Open the connection and update the document.
        client.connect(URL, function (err, db) {
          if (err) {  
            call(callback, err);
          }
          else {
            var collection = db.collection(collectionName);
            collection.update(id, {$set: doc}, function(err, result) {
              db.close();
              result = result ? result.result : null;
              call(callback, err, result);
            });  
          }
        });
      }
      else {
        call(callback, new Error('Key violation. A proper mongo document must be passed with the _id attribute.'))
      }
    }
  }
};

/**
 * The delete operation is used to remove documents from the specified collection
 * that matches the criteria.
 * @param {string} collection The name of the target mongo collection.
 * @param {object} doc The document to be stored.
 * @param {function} callback The command result callback.
 * @return {null}
 */
var _delete = CRUD.delete = function (collection, criteria, callback) {
  var collectionName = typeof collection === 'string' ? collection.toLowerCase() : null
    , where = typeof criteria === 'function' ? {} : criteria
    , callback = typeof criteria === 'function' ? criteria : callback;

  if (!URL) {
    call(callback, new Error('Cannot perform CRUD operations until connect is called with a valid Mongo Server URI.'));
  }
  else {
    if (!collectionName) {
      call(callback, new Error('No collection name specified.'));
    }
    else {
      client.connect(URL, function (err, db) {
        if (err) {
          call(callback, err);
        }
        else {
          var collection = db.collection(collectionName);
          collection.remove(criteria, function (err, result) {
            db.close();
            result = result ? result.result : null;
            call(callback, err, result);
          });
        }
      });
    }
  }
};


/**
 * Opens a Single connection to the MongoDB instance. The instance can be changed
 * at anytime by calling this function again.
 * @param {string} URL The connection URI string
 * @param {CRUD~connectCallback} callback The command result callback
 * @return {null}
 */
var Connect = CRUD.connect = function (url, callback) {

  console.log('Testing database connection...');
  client.connect(url, function(err, db) {

    if (!err) {
      console.log('Success!' + url);
      URL = url;
      db.close();
    }else{
      URL = url;
    }

    call(callback, err);

  });

};

// Helper functions
// ----------------------------------------------------------

/**
 * This helper function is used to execute callback functions in a save way. Provides
 * use for up to 3 passed parameters to the calling function.
 * @param {function} fn The function to be called.
 * @param {object} err The error object to be passed to the function.
 * @param {any} param1 The first parameter to be passed to the function.
 * @param {any} param2 The second parameter to be passed to the function.
 * @param {any} param3 The third parameter to be passed to the function.
 * @return {null}
 */
var call = function (fn, err, param1, param2, param3) {
  if (typeof fn === 'function') {
    return fn(err, param1, param2, param3);
  }

  // If there is an error and no function to pass to throw the error 
  // into the wild to punish the wickedness within thy callers' heart.
  if (err) {
    throw err;
  }

};

/**
 * Checks if the object has been initilized. A succesfully initialized object has a 
 * valid tested connection.
 * @return {boolean} The boolean flag for connection state True or False.
 */
CRUD.isReady = function (){
	return URL === null ? false : true;
};

module.exports = CRUD;

