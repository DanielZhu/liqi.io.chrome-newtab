/* global chrome:false */

// Copyright (c) 2016 Zhu Meng-Dan(Daniel). All rights reserved.
'use strict';

// var storage = new Storage();

// function syncConfig() {
//     var configCached = storage.get(consts.configName) || {};
//     var initSetting = consts.settingList;

//     // 初始化所有默认配置项，若发现不存在的配置项，补上
//     for (var i = 0; i < initSetting.length; i++) {
//         var setItem = initSetting[i];
//         for (var j = 0; j < setItem.items.length; j++) {
//             var item = setItem.items[j];

//             if (configCached && configCached.hasOwnProperty('data')) {
//                 if (!configCached.data.hasOwnProperty(item.key)) {
//                     configCached.data[item.key] = item.init;
//                 }
//             }
//             else {
//                 configCached[item.key] = item.init;
//             }
//         }
//     }

//     var finalConfig = configCached.hasOwnProperty('data') ? configCached.data : configCached;
//     storage.set(consts.configName, finalConfig);

//     SdTJ.trackEventTJ(SdTJ.category.bgNotify, 'syncConfig', '');

//     return finalConfig;
// }

// function retrieveConfigCached() {
//     var config = {};
//     var configCached = storage.get(consts.configName) || {};
//     if (configCached) {
//         config = configCached.data;
//     }
//     else {
//         config = syncConfig();
//     }

//     return config;
// }

// function stripHtmlTag(htmlString) {
//     var divNode = document.createElement('div');
//     divNode.innerHTML = htmlString;

//     return divNode.innerText;
// }

// function updateStorage(pairs, opts) {
//     if (pairs.length === 0) {
//         return;
//     }

//     // 是否存在有效的更新项目
//     var updatedFlag = false;
//     var configCached = storage.get(consts.configName);
//     if (configCached) {
//         for (var i = 0; i < pairs.length; i++) {
//             var key = pairs[i].key;
//             configCached.data[key] = pairs[i].value;
//             updatedFlag = true;
//             var optValue = (typeof pairs[i].value === 'boolean' ? (pairs[i].value ? 1 : 0) : pairs[i].value);
//             SdTJ.trackEventTJ(SdTJ.category.bgNotify, 'updateStorage', key, optValue);
//         }
//         updatedFlag && storage.set(consts.configName, configCached.data, opts);
//     }
//     else {
//         syncConfig();
//     }
// }

// function notifyClicked(notifyId, btnIdx) {
//     var notifyIdArr = notifyId.split('_');
//     var id = notifyIdArr[notifyIdArr.length - 1];
//     var channel = notifyIdArr[notifyIdArr.length - 2];
//     var actionLabel = 'clickedOnList';

//     if (id !== -1) {
//         actionLabel = 'clickedOnCertainItem';
//         if (btnIdx) {
//             if (btnIdx === 0) {
//                 updateBadgeByNotifyClicked.call(this);
//                 openTabForUrl(consts.host + channel + '.html?id=' + id + '&' + consts.tjDetailRedirect);
//             }
//             else {
//                 // No this kind of button
//             }
//         }
//         else {
//             updateBadgeByNotifyClicked.call(this);
//             var outerLink = consts.host + channel + '.html?id=' + id + '&' + consts.tjDetailRedirect;
//             openTabForUrl(outerLink);
//         }
//     }
//     else {
//         updateBadge(0);
//         openTabForUrl(consts.host + '?' + consts.tjDetailRedirect);
//     }

//     hideWarning(notifyId);
//     SdTJ.trackEventTJ(SdTJ.category.pushNotify, actionLabel, 'notifyId', +id);
// }

// function fetchingAlarmTrigger(oldBadge) {
//     // 抓取百度惠精选商品列表定时器
//     updateBadge('...');
//     sdHuiCore.sendPost({
//         apiName: 'recmdList',
//         params: {
//             page: {
//                 pageNo: 1,
//                 pageSize: notifySizePerPage || 10
//             },
//             condition: {}
//         },
//         success: function (data) {
//             var item = {};
//             for (var i = 0; i < data.data.result.length; i++) {
//                 item = data.data.result[i];
//                 data.data.result[i].progressAt = item.likeNum / (item.likeNum + item.unlikeNum) * 100;
//             }

//             // 比对结果，包含最新和最旧
//             var persistTopResult = sdHuiCore.persistTop20.call(sdHuiCore, data.data.result, 1);
//             var freshList = persistTopResult.freshList;
//             var freshItemCount = freshList.length;

//             // 此次对比时缓存中的数据
//             var cachedList = persistTopResult.persistedList;

//             var now = new Date();
//             console.log('%c[Magnet] freshItemCount - ' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ': ' + freshItemCount, 'color: #E69B95; font-weight: bold;');

//             // v1.0.1 - 使用筛选后的增量更新列表，而不再继续截取靠前部分
//             // v1.0.8 - Fix: sometime the Badge Text will be update to empty
//             if (oldBadge) {
//                 unreadCount = oldBadge + freshItemCount;
//                 updateBadge(unreadCount > 0 ? unreadCount : 0);
//             }
//             else {
//                 chrome.browserAction.getBadgeText({}, function (obj) {
//                     if (obj === 'DND') {
//                         unreadCount += freshItemCount;
//                     }
//                     else {
//                         unreadCount = (parseInt(obj, 10) || 0) + freshItemCount;
//                     }

//                     updateBadge(unreadCount > 0 ? unreadCount : 0);
//                 });
//             }

//             var configCached = retrieveConfigCached();
//             var dndExpiredAt = configCached['dnd-expired-at'];
//             if (!dndExpiredAt || (dndExpiredAt && now > dndExpiredAt)) {
//                 if (freshItemCount < notifySizePerPage && cachedList.length !== 0) {
//                     updateStorage([{key: 'dnd-expired-at', value: false}]);
//                     pushNotification(freshList);
//                 }
//                 if (freshItemCount > 0) {
//                     var badgeIconAnimate = new BadgeIconAnimate(consts.extIcons.active);
//                     var animBaBadgeNew = configCached['anim-ba-badge-new'];
//                     switch (animBaBadgeNew) {
//                         case '随机':
//                             badgeIconAnimate.randomAnim();
//                             break;
//                         case '快旋':
//                             badgeIconAnimate.startShake();
//                             break;
//                         case '飞入':
//                             badgeIconAnimate.randomFlayIn();
//                             break;
//                         default:
//                             badgeIconAnimate.randomAnim();
//                             break;
//                     }
//                 }
//             }

//             SdTJ.trackEventTJ(SdTJ.category.bgNotify, 'fetchListAlarm', 'count', freshItemCount);
//         },
//         failure: function (data, textStatus, jqXHR) {
//             if (oldBadge) {
//                 updateBadge(oldBadge > 0 ? oldBadge : 0);
//             }
//             else {
//                 updateBadge(0);
//             }
//             console.log('[Magnet] Failed Fetching: ' + JSON.stringify(data));
//             SdTJ.trackEventTJ(SdTJ.category.bgNotify, 'fetchListAlarm', 'count', -1);
//         }
//     });
// }

// function openTabForUrl(url) {
//     chrome.tabs.create({url: url}, function (tab) {
//         chrome.windows.update(tab.windowId, {focused: true}, function () {});
//     });
// }

// // 注册各种事件
// chrome.runtime.onInstalled.addListener(function () {
//     syncConfig();
// });

// chrome.alarms.onAlarm.addListener(function (alarm) {
//     switch (alarm.name) {
//         // 拉取定时器
//         case alarmNameFetchList:
//             chrome.browserAction.getBadgeText({}, function (obj) {
//                 if (obj !== 'DND') {
//                     unreadCount = parseInt(obj, 10) || 0;
//                 }
//                 fetchingAlarmTrigger(unreadCount);
//             });
//             break;
//         default:
//             break;
//     }
// });


// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         switch (request.type) {
//             case 'pushItem':
//                 break;
//             default:
//                 break;
//         }
//     }
// );

// syncConfig();
// setFetchAlarm();
