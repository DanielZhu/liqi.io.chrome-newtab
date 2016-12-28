/* eslint-disable no-console */
/* global console, chrome */

'use strict'

/**
 * @file indexedDb OP
 *
 * @author Daniel Zhu <enterzhu@gmail.com>
 */
var Ajax = (typeof Ajax === 'undefined') ? require('./ajax.js') : Ajax
var SdTJ = (typeof SdTJ === 'undefined') ? require('./tj.js') : SdTJ
function IDB () {
  this.db = {}
  this.dbName = 'ideaPumps' // Database name
  this.inited = false
    // Database version
    // The version number is an unsigned long long number,
    // which means that it can be a very big integer.
    // It also means that you can't use a float,
    // otherwise it will be converted to the closest lower integer and the transaction may not start, nor the upgradeneeded event trigger
  this.dbVersion = 5
  this.limitedRetryTimes = 10
  this.tableName = 'ideaQuotes' // Table name
}

IDB.prototype.open = function () {
  var self = this

    // Init the instance of indexedDB
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB

  if (!indexedDB) {
    console.error('Your browser doesn\'t support a stable version of IndexedDB.')
  }

    // The call to the open() function returns an IDBOpenDBRequest object
    // with a result (success) or error value that you handle as an event
  var idbOpenDBRequest = indexedDB.open(this.dbName, this.dbVersion)

    // event of initing the database
  idbOpenDBRequest.onupgradeneeded = function (e) {
        // console.log('onupgradeneeded');
        // Fetch the IDBDatabase
    self.db = e.target.result

        // Create the instance of db
    self.createObjectStore()
  }

    // Error Callback Handler
  idbOpenDBRequest.onerror = function (e) {
        // console.log(e.target.errorCode);
  }

    // Success Callback Handler
  idbOpenDBRequest.onsuccess = function (e) {
        // Get the indexedDb object
    self.db = e.target.result

    if (!self.inited) {
      var store = self.db.transaction(self.tableName).objectStore(self.tableName)

      var request = store.count()
      request.onsuccess = function (e) {
        var count = e.target.result
        if (!count || count < 215) {
          self.addInitData()
        } else {
          self.inited = true
        }
      }
    }
  }
}

IDB.prototype.createObjectStore = function () {
  var self = this
    // Create an objectStore to hold information about our ideaQuotes. We're
    // going to use "id" as our key path because it's guaranteed to be
    // unique - or at least that's what I was told during the kickoff meeting.
  var objectStore = this.db.createObjectStore(this.tableName, {keyPath: 'id'})

    // Create an index to search ideaQuotes by name. We may have duplicates
    // so we can't use a unique index.
  objectStore.createIndex('id', 'id', {unique: true})

    // Use transaction oncomplete to make sure the objectStore creation is
    // finished before adding data into it.
  objectStore.transaction.oncomplete = function (event) {
        // Store values in the newly created objectStore.
        // this is what our ideaQuotes data looks like.
    self.addInitData()
  }
}

IDB.prototype.randomRecord = function (done, failCb) {
  var self = this
  this.checkDbInstance({
    name: 'randomRecord',
    onFound: function (retryTimes) {
      var store = self.db.transaction(self.tableName).objectStore(self.tableName)

      var request = store.count()
      request.onsuccess = function (e) {
        var count = e.target.result
        if (!count || count === 0) {
          setTimeout(function () {
            self.randomRecord(done)
          }, 800)
        } else {
                    // check and add init data
          var randomNum = parseInt(Math.random() * count, 10)
                    // console.log('randomNum: ' + randomNum + '| count: ' + count);
          self.stepThrough(randomNum, done)
        }
      }
    },
    onNotFound: function (retryTimes) {
      if (retryTimes >= self.limitedRetryTimes) {
        SdTJ.trackEventTJ(
                    SdTJ.category.newTab,
                    'randomIdeaPump',
                    'onNotFound',
                    retryTimes
                )
        failCb && failCb()
      }
    }
  })
}

IDB.prototype.stepThrough = function (idx, done) {
  var self = this
  SdTJ.trackEventTJ(
        SdTJ.category.newTab,
        'randomIdeaPump',
        'randomNum',
        idx
    )
  this.checkDbInstance({
    name: 'stepThrough',
    onFound: function () {
      var objectStore = self.db.transaction(self.tableName).objectStore(self.tableName)
      var index = 0
      objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result
        if (cursor) {
          if (index === idx) {
            done(cursor.value)
          } else {
            cursor.continue()
          }
        } else {
          console.log('No more entries!')
        }

        index++
      }
    }
  })
}

IDB.prototype.analyzePost = function (post) {
  delete post.status
  delete post.categories
  delete post.tags
  delete post.author
  delete post.comments
  delete post.attachments
  delete post.comment_count
  delete post.comment_status
  delete post.custom_fields
  delete post.taxonomy_randomizer_category
    // Replace the </br> with <br />
  var reg = new RegExp('</br>', 'g')
  post.content = post.content.replace(reg, '<br />')
    // Remove <br />\n——
  reg = new RegExp('<br /><br />\n——<a href', 'g')
  post.content = post.content.replace(
        reg,
        '<a class="quote-author" href'
    )
    // Remove <p>——<a href
  reg = new RegExp('<p>——<a href', 'g')
  post.content = post.content.replace(
        reg,
        '<a class="quote-author" href'
    )

  return post
}

IDB.prototype.addInitData = function () {
  var self = this

  if (!this.inited) {
    this.checkDbInstance({
      name: 'addInitData',
      onFound: function () {
        var ajax = new Ajax()
        var url = chrome.runtime.getURL
                    ? chrome.runtime.getURL('./src/offline/ideapumpList.json')
                    : './src/offline/ideapumpList.json'
        ajax.sendGet({
          url: url,
          params: {},
          success: function (data) {
            if (data.hasOwnProperty('posts') && data.posts.length > 0) {
              for (var i = data.posts.length - 1; i >= 0; i--) {
                if (data.posts[i].status !== 'publish') {
                  data.posts.slice(i, 1)
                } else {
                                    // Clear useless attributes
                  data.posts[i] = self.analyzePost(data.posts[i])
                }
              }

              self.addData(data.posts)
            }
          },
          failure: function (data, textStatus, jqXHR) {
          },
          ontimeout: function (data, textStatus, jqXHR) {
          }
        })
      }
    })
  }
}

IDB.prototype.addData = function (data) {
  var self = this
  this.checkDbInstance({
    name: 'addData',
    onFound: function () {
      var tobeAddCount = data.length
      var addedCount = 0
      var duplicateCount = 0
      var idsArrayInDb = []

      var transaction = self.db.transaction([self.tableName], 'readwrite')
      var ideaQuoteObjectStore = transaction.objectStore(self.tableName)

      ideaQuoteObjectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result
        if (cursor) {
          idsArrayInDb.push(cursor.value.id)
          cursor.continue()
        } else {
                    // console.log('idsArrayInDb: ' + idsArrayInDb);
          var onsuccess = function (e) {
            addedCount++
          }
          var onerror = function (e) {}
          for (var i = 0; i < data.length; i++) {
            if (idsArrayInDb.indexOf(data[i].id) === -1) {
              var request = ideaQuoteObjectStore.add(data[i])
              request.onsuccess = onsuccess
              request.onerror = onerror
            } else {
              duplicateCount++
            }
          }

                    // Do something when all the data is added to the database.
          transaction.oncomplete = function (event) {
            if (addedCount + duplicateCount === tobeAddCount) {
              self.inited = true
            }

            SdTJ.trackEventTJ(
                            SdTJ.category.idb,
                            'addData',
                            'success_count',
                            addedCount
                        )

                        // console.log('dupCount: ' + duplicateCount + ', '
                            // + addedCount + ' / ' + tobeAddCount + ' records done!');
          }

                    // Do something when the data transition has been aborted
          transaction.onerror = function (event) {
            SdTJ.trackEventTJ(
                            SdTJ.category.idb,
                            'addData',
                            'fail_count',
                            tobeAddCount - duplicateCount - addedCount
                        )
                        // console.log('dupCount: ' + duplicateCount + ', '
                            // + (tobeAddCount - addedCount) + ' / ' + tobeAddCount + ' records failed!');
          }
        }
      }
    }
  })
}

IDB.prototype.checkDbInstance = function (opts) {
  var self = this
  if (this.db.name !== 'ideaPumps') {
    this.open()
  }
  // var callerName = opts.name || ''
  var onFound = opts.onFound || function () {}
  var onNotFound = opts.onNotFound || function () {}
  var loopTime = 0

  var timer = setInterval(function () {
        // console.log(callerName + ' loopTime: ' + loopTime);
    if (loopTime < self.limitedRetryTimes) {
      if (self.db.name === 'ideaPumps') {
        clearInterval(timer)
                // console.log(callerName + ' callerNameclearInterval: ' + loopTime);
        onFound(loopTime)
      } else {
        onNotFound(loopTime)
                // console.log(callerName + ' notfound loopTime: ' + loopTime);
      }
      loopTime++
    } else {
      onNotFound(loopTime)
      clearInterval(timer)
    }
  }, 80)
}
// Open the db event op instance -> db object -> store object
/* eslint-enable no-console */

if (typeof define !== 'undefined') {
  define(function (require) {
    return IDB
  })
}
