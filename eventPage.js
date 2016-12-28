/**
 * @file runnning in background
 *
 * @author Daniel Zhu <enterzhu@gmail.com>
 */
'use strict'
var idb = new IDB()

var initLocalQuoteTimerStarted = false
var ajax = new Ajax()
var alarmNameFetchList = 'alarm-fetch-ideaQuote'
var alarmNameInitLocalQuote = 'alarm-init-local-quote'

var initLocalQuoteRetryTimes = 0
var initLocalQuoteRetryTimesMaxLimit = 10

// function stripHtmlTag(htmlString) {
//     var divNode = document.createElement('div');
//     divNode.innerHTML = htmlString;

//     return divNode.innerText;
// }

function dealDataAndSave (posts) {
  for (var i = posts.length - 1; i >= 0; i--) {
    if (posts[i].status !== 'publish') {
      posts.slice(i, 1)
    } else {
            // Clear useless attributes
      delete posts[i].status
      delete posts[i].categories
      delete posts[i].tags
      delete posts[i].author
      delete posts[i].comments
      delete posts[i].attachments
      delete posts[i].comment_count
      delete posts[i].comment_status
      delete posts[i].custom_fields
      delete posts[i].taxonomy_randomizer_category
            // Replace the </br> with <br />
      var reg = new RegExp('</br>', 'g')
      posts[i].content = posts[i].content.replace(reg, '<br />')
            // Remove <br />\n——
      reg = new RegExp('<br /><br />\n——<a href', 'g')
      posts[i].content = posts[i].content.replace(reg, '<a class="quote-author" href')
            // Remove <p>——<a href
      reg = new RegExp('<p>——<a href', 'g')
      posts[i].content = posts[i].content.replace(reg, '<a class="quote-author" href')
    }
  }

  idb.addData(posts)
}

function fetchLatestList () {
  var nowStamp = new Date().getTime()
  ajax.sendGet({
    url: 'http://liqi.io/randomizer/',
    params: {
      json: 'get_posts',
      page: 1,
      count: 30
    },
    timeout: 15000,
    success: function (data) {
      if (data.hasOwnProperty('posts') && data.posts.length > 0) {
        dealDataAndSave(data.posts)
      }
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'fetchLatestList',
                'timeCostInMs_success',
                new Date().getTime() - nowStamp
            )
    },
    failure: function (data, textStatus, jqXHR) {
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'fetchLatestList',
                'timeCostInMs_fail',
                new Date().getTime() - nowStamp
            )
    }
  })
}

function setFetchAlarm () {
  chrome.alarms.create(alarmNameFetchList, {
    periodInMinutes: 60 * 3.5 //  Fetch the data every x hours: 60 * x
  })
}

function startInitLocalQuoteChecker () {
  chrome.alarms.create(alarmNameInitLocalQuote, {
    periodInMinutes: 1
  })
}

function initLocalQuote () {
  var nowStamp = new Date().getTime()
  ajax.sendGet({
    url: chrome.runtime.getURL('./src/offline/ideapumpList.json'),
    params: {},
    success: function (data) {
      if (data.hasOwnProperty('posts') && data.posts.length > 0) {
        dealDataAndSave(data.posts)
        initLocalQuoteTimerStarted = true
        chrome.alarms.clear(alarmNameInitLocalQuote, function () {})
      }
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'initLocalQuote',
                'timeCostInMs_success',
                new Date().getTime() - nowStamp
            )
    },
    failure: function (data, textStatus, jqXHR) {
      !initLocalQuoteTimerStarted && startInitLocalQuoteChecker()
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'initLocalQuote',
                'timeCostInMs_fail',
                new Date().getTime() - nowStamp
            )
    },
    ontimeout: function (data, textStatus, jqXHR) {
      !initLocalQuoteTimerStarted && startInitLocalQuoteChecker()
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'initLocalQuote',
                'timeCostInMs_timeout',
                new Date().getTime() - nowStamp
            )
    }
  })
}

function fetchRandomQuote () {
  var nowStamp = new Date().getTime()
  ajax.sendGet({
    url: 'http://liqi.io/idea-pump/',
    params: {
      json: '1'
    },
    success: function (data) {
      if (data.hasOwnProperty('page') && data.page) {
        dealDataAndSave([data.page])
      }
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'fetchRandomQuote',
                'timeCostInMs_success',
                new Date().getTime() - nowStamp
            )
    },
    failure: function (data, textStatus, jqXHR) {
      SdTJ.trackEventTJ(
                SdTJ.category.bgAction,
                'fetchRandomQuote',
                'timeCostInMs_fail',
                new Date().getTime() - nowStamp
            )
    }
  })
}

function openTabForUrl (url) {
  chrome.tabs.create({url: url}, function (tab) {
    chrome.windows.update(tab.windowId, {focused: true}, function () {})
  })
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  switch (alarm.name) {
        // Fetch data
    case alarmNameFetchList:
      fetchLatestList()
      break
    case alarmNameInitLocalQuote:
      initLocalQuoteRetryTimes++
      if (initLocalQuoteRetryTimes >= initLocalQuoteRetryTimesMaxLimit) {
        chrome.alarms.clear(alarmNameInitLocalQuote, function () {})
      } else {
        initLocalQuote()
        SdTJ.trackEventTJ(
                    SdTJ.category.bgAction,
                    'initLocalQuoteRetry'
                )
      }
      break
    default:
      break
  }
})

// Register the event fired after installed
chrome.runtime.onInstalled.addListener(function (detail) {
    // Fetch top 18 & save to local
  initLocalQuote()
    // "install", "update", "chrome_update", or "shared_module_update"
  SdTJ.trackEventTJ(
        SdTJ.category.bgAction,
        'mgr_' + detail.reason
    )
})

// It need more permission if do these codes below
// The policy will disable the extension until user re-enable the extension again
// This will lose existing users, so cancelled
// chrome.management.onUninstalled.addListener(function () {
//     SdTJ.trackEventTJ(
//         SdTJ.category.bgAction,
//         'mgr_uninstall'
//     );
// });

// chrome.management.onEnabled.addListener(function () {
//     SdTJ.trackEventTJ(
//         SdTJ.category.bgAction,
//         'mgr_enabled'
//     );
// });

// chrome.management.onDisabled.addListener(function () {
//     SdTJ.trackEventTJ(
//         SdTJ.category.bgAction,
//         'mgr_disabled'
//     );
// });

// 注册接收事件
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      switch (request.type) {
        case 'randomQuote':
          break
        default:
          break
      }
    }
)

// syncConfig();
setFetchAlarm()
/* eslint-enable no-console */
