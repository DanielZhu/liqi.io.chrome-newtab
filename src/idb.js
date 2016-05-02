/* eslint-disable no-console */
/* global console: false; */

'use strict'

/**
 * @file indexedDb OP
 *
 * @author Daniel Zhu <enterzhu@gmail.com>
 */
function IDB() {
    this.db = {}; // db object
    this.dbName = 'ideaPumps'; // Database name

    // Database version
    // The version number is an unsigned long long number,
    // which means that it can be a very big integer.
    // It also means that you can't use a float,
    // otherwise it will be converted to the closest lower integer and the transaction may not start, nor the upgradeneeded event trigger
    this.dbVersion = 5;
    this.tableName = 'idea_quato'; // Table name
}

IDB.prototype.open = function () {
    var self = this;

    // 实例化IndexDB数据上下文，这边根据浏览器类型来做选择
    window.indexedDB = window.indexedDB || window.webkitIndexedDB;

    if (!window.indexedDB) {
        window.alert('Your browser doesn\'t support a stable version of IndexedDB.');
    }

    // The call to the open() function returns an IDBOpenDBRequest object
    // with a result (success) or error value that you handle as an event
    var idbOpenDBRequest = window.indexedDB.open(this.dbName, this.dbVersion);

    // event of initing the database
    idbOpenDBRequest.onupgradeneeded = function (e) {
        // Fetch the IDBDatabase
        self.db = e.target.result;

        console.log(self.db);
        // Create the instance of db
        self.createObjectStore();
    };

    // Error Callback Handler
    idbOpenDBRequest.onerror = function (e) {
        console.log(e.target.errorCode);
    };

    // Success Callback Handler
    idbOpenDBRequest.onsuccess = function (e) {
        // 获取数据库对象
        // 因为上面的初始化事件未必会被调用到，这里当然也得获取一次
        self.db = e.target.result;
        // self.createObjectStore();
    };
};

IDB.prototype.createObjectStore = function () {
    // Create an objectStore to hold information about our ideaQuatos. We're
    // going to use "id" as our key path because it's guaranteed to be
    // unique - or at least that's what I was told during the kickoff meeting.
    var objectStore = this.db.createObjectStore('ideaQuatos', {keyPath: 'id'});

    // Create an index to search ideaQuatos by name. We may have duplicates
    // so we can't use a unique index.
    objectStore.createIndex('id', 'id', {unique: true});

    // Use transaction oncomplete to make sure the objectStore creation is
    // finished before adding data into it.
    objectStore.transaction.oncomplete = function (event) {
        // Store values in the newly created objectStore.
        // this is what our ideaQuatos data looks like.

    };
};

IDB.prototype.randomRecord = function (done) {
    var self = this;

    var timer = setInterval(function () {
        if (self.db.name === 'ideaPumps') {
            clearInterval(timer);
            var store = self.db.transaction('ideaQuatos').objectStore('ideaQuatos');

            var request = store.count();
            request.onsuccess = function (e) {
                var count = e.target.result;
                console.log('count: ' + count);
                var randomNum = parseInt(Math.random() * count, 10);
                console.log('randomNum: ' + randomNum);
                self.stepThrough(randomNum, done);
            };
        }
    });
};

IDB.prototype.stepThrough = function (idx, done) {
    var self = this;
    var timer = setInterval(function () {
        if (self.db.name === 'ideaPumps') {
            clearInterval(timer);
            var objectStore = self.db.transaction('ideaQuatos').objectStore('ideaQuatos');
            var index = 0;
            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (index === idx) {
                        done(cursor.value);
                    }
                    else {
                        cursor.continue();
                    }
                }
                else {
                    console.log('No more entries!');
                }
                index++;
            };
        }
    }, 50);
};

IDB.prototype.addData = function (data) {
    var self = this;
    var timer = setInterval(function () {
        var tobeAddCount = data.length;
        var addedCount = 0;
        if (self.db.name === 'ideaPumps') {
            clearInterval(timer);
            var transaction = self.db.transaction(['ideaQuatos'], 'readwrite');

            var ideaQuatoObjectStore = transaction.objectStore('ideaQuatos');
            for (var i = 0; i < data.length; i++) {
                var request = ideaQuatoObjectStore.add(data[i]);
                request.onsuccess = function (e) {
                    addedCount++;
                };
                request.onerror = function (e) {
                };
            }

            // Do something when all the data is added to the database.
            transaction.oncomplete = function (event) {
                console.log(addedCount + ' / ' + tobeAddCount + ' records done!');
            };

            // Do something when the data transition has been aborted
            transaction.onerror = function (event) {
                if (addedCount > 0) {
                    self.addData(data.slice(0, addedCount));
                }
                console.log((tobeAddCount - addedCount) + ' / ' + tobeAddCount + ' records failed!');
            };
        }
    }, 50);
};

// 打开数据库操作的事件对象 -> 数据库对象 -> 存储对象
/* eslint-enable no-console */

if (typeof define !== 'undefined') {
    define(function (require) {
        return IDB;
    });
}
