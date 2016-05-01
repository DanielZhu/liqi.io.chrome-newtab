<template>
    <div id="app">
        <div class="quato" v-html="quato.content"></div>
        <div class=""></div>
    </div>
</template>

<script>
var IDB = require('./idb.js');
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
            });
        }
    }
}
</script>

<style>
body {
  font-family: Helvetica, sans-serif;
}
</style>
