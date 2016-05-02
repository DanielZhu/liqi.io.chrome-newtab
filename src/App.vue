<template>
    <div id="app">
        <div class="quote" v-html="quote.content | simplify"></div>
        <div class=""></div>
    </div>
</template>

<script>
var IDB = require('./libs/idb.js');
var tj = require('./libs/tj.js');
var idb = new IDB();
export default {
    data () {
        return {
            // note: changing this line won't causes changes
            // with hot-reload because the reloaded component
            // preserves its current state and we are modifying
            // its initial state.
            quote: {
                content: ''
            },
            nowStamp: null
        }
    },
    filters: {
        simplify: function (value) {
            // Replace the </br> with <br />
            var reg = new RegExp('</br>', 'g');
            value = value.replace(reg, '<br />');
            // Remove <br />\n——
            reg = new RegExp('<br /><br />\n——<a href', 'g');
            value = value.replace(reg, '<a class="quote-author" href');
            // Remove <p>——<a href
            reg = new RegExp('<p>——<a href', 'g');
            value = value.replace(reg, '<a class="quote-author" href');

            return value;
        }
    },
    ready: function () {
        this.randomIdeaPump();
    },
    methods: {
        linkClicked: function (e) {
            tj.trackEventTJ(
                tj.category.newTab,
                'redirectOut',
                'stayTimeCostInMs',
                new Date().getTime() - this.nowStamp
            );
        },
        randomIdeaPump: function () {
            var self = this;
            this.nowStamp = new Date().getTime();
            tj.trackEventTJ(
                tj.category.newTab,
                'newtabRequest',
                'timeCostInMs',
                new Date().getTime() - this.nowStamp
            );
            idb.open();
            idb.randomRecord(function (response) {
                self.quote = response;
                tj.trackPageViewTJ(tj.pageLists.newtab);
                setTimeout(function () {
                    var aNode = document.getElementsByTagName('a');
                    for (var i = 0; i < aNode.length; i++) {
                        aNode[i].onclick = self.linkClicked;
                    }
                }, 800);
            });
        }
    }
}
</script>

<style>
@import url(./assets/css/normalize.css);
body {
    background-color: #F7F7F7;
    color: #666;
    font-family: Helvetica, sans-serif;
}
a:visited {
    color: #638CDC;
}
a:link {
    color: #638CDC;
}
a {
    color: #000000;
    font-family: -apple-system, BlinkMacSystemFont,"Helvetica Neue","PingFang-SC-Regular","STHeiti", "Helvetica","Arial","Verdana","sans-serif","Microsoft YaHei";
    text-decoration: none;
}

#app {
    position: relative;
    width: 100%;
    font-size: 16px;
}

.quote {
    position: relative;
    width: 60%;
    margin: 20% auto;
    line-height: 2
}
.quote-author {
    text-align: right;
    display: block;
}
</style>
