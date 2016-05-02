<template>
    <div id="app">
        <div class="quato" v-html="quato.content"></div>
        <div class=""></div>
    </div>
</template>

<script>
var IDB = require('./idb.js');
var tj = require('./tj.js');
var idb = new IDB();
export default {
    data () {
        return {
            // note: changing this line won't causes changes
            // with hot-reload because the reloaded component
            // preserves its current state and we are modifying
            // its initial state.
            quato: {}
        }
    },
    ready: function () {
        this.sendMessageToBg();
    },
    methods: {
        sendMessageToBg: function () {
            var self = this;
            idb.open();
            idb.randomRecord(function (response) {
                self.quato = response;
                tj.trackPageViewTJ(tj.pageLists.newtab);
            });
        }
    }
}
</script>

<style>
@import url(./assets/css/normalize.css);
body {
    background-color: #F7F7F7;
    font-family: Helvetica, sans-serif;
}
a:visited {
    color: #3769c9;
}
a:link {
    color: #3769c9;
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

.quato {
    position: relative;
    width: 60%;
    margin: 0 auto;
}
</style>
