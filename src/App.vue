<style lang="stylus">
    @import './assets/css/normalize.css'
    @import './assets/css/newtab.styl'
</style>

<template>
    <div id="app">
        <div class="quote">
            <div v-html="quote.content"></div>
            <div id="quote-mark"><img src="./assets/images/quote-mark.png" class="quote-mark-icon"></div>
        </div>
        <div class="tools">
            <div class="refresh-quote-btn">
                <img src="./assets/images/refresh.png" class="btn-icon" v-on:click="randomIdeaPump">
            </div>
            <div class="see-liqi-site-btn">
                <a href="{{liqiPageLink}}" target="_blank" name="seeLiqiLink"><img src="./assets/images/link.png" class="btn-icon"></a>
            </div>
            <div class="about-extension-and-author-btn">
                <a href="http://liqi.io/new-tab-for-idea-pump" target="_blank" name="aboutExtensionAndAuthor"><img src="./assets/images/info.png" class="btn-icon"></a>
            </div>
        </div>
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
            liqiPageLink: 'http://liqi.io',
            nowStamp: null
        }
    },
    filters: {
    },
    ready: function () {
        this.randomIdeaPump();
    },
    methods: {
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
        },
        linkClicked: function (e) {
            var actionName = 'redirectOut';
            if (e.target.parentNode.name && e.target.parentNode.name.trim() !== '') {
                actionName = 'redirectOut_' + e.target.parentNode.name;
            }
            tj.trackEventTJ(
                tj.category.newTab,
                actionName,
                'stayTimeCostInMs',
                new Date().getTime() - this.nowStamp
            );
        },
        randomIdeaPump: function () {
            var self = this;
            this.nowStamp = new Date().getTime();
            tj.trackEventTJ(
                tj.category.newTab,
                'randomIdeaPump',
                'timeCostInMs',
                new Date().getTime() - this.nowStamp
            );
            idb.open();
            idb.randomRecord(function (resp) {
                resp.content = self.simplify(resp.content);
                var cutString = '<a class="quote-author" href=\"';
                var authorLink = resp.content.substring(resp.content.indexOf(cutString) + cutString.length);
                self.quote = resp;
                self.liqiPageLink = authorLink.substring(0, authorLink.indexOf('\"'));
                tj.trackPageViewTJ(tj.pageLists.newtab);
                setTimeout(function () {
                    var aNode = document.getElementsByTagName('a');
                    for (var i = 0; i < aNode.length; i++) {
                        aNode[i].onclick = self.linkClicked;
                    }
                    // var quoteEl = document.getElementsByClassName('quote')[0];
                    // var divEl = document.getElementById('quote-mark');
                    // console.log(1);
                    // if (divEl) {
                    //     quoteEl.appendChild(divEl);
                    // }
                    // self.liqiPageLink = document.getElementsByClassName('quote-author')[0].getAttribute('href');
                }, 800);
            });
        }
    }
}
</script>
