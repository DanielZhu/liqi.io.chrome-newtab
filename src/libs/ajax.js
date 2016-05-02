/**
 * @file Ajax Lib
 *
 * @author Daniel Zhu<enterzhu@gmail.com>
 * @description
 */
function Ajax() {
    this.loadXMLHttp = function () {
        var xmlhttp;
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }

        return xmlhttp;
    };
}

Ajax.prototype.post = function (inParams) {
    var xhr = this.loadXMLHttp();
    xhr.timeout = inParams.timeout || 7000;

    xhr.open('POST', inParams.url, true);

    // set headers
    // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Content-Type', 'application/json');
    // xhr.setRequestHeader('charset', 'UTF-8');

    // xhr.onload = function (data) {
    // };

    xhr.onreadystatechange = function (res) {
        if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                inParams.callback.success && inParams.callback.success(JSON.parse(xhr.responseText));
            }
            else {
                inParams.callback.failure && inParams.callback.failure({
                    responseText: res.currentTarget.responseText,
                    readyState: res.currentTarget.readyState,
                    status: res.currentTarget.status
                });
            }

            xhr.onreadystatechange = new Function();
            xhr = null;
        }
    };
    xhr.ontimeout = inParams.callback.hasOwnProperty('ontimeout') && inParams.callback.ontimeout;
    xhr.send(inParams.body);
    return xhr;
};

Ajax.prototype.get = function (inParams) {
    var xhr = this.loadXMLHttp();
    xhr.timeout = inParams.timeout || 7000;

    var querys = [];
    for (var key in inParams.body) {
        if (inParams.body.hasOwnProperty(key)) {
            querys.push(key + '=' + inParams.body[key]);
        }
    }
    var queryStr = querys.join('&');

    xhr.open('GET', inParams.url + '?' + queryStr, true);

    // set headers
    // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Content-Type', 'application/json');
    // xhr.setRequestHeader('charset', 'UTF-8');

    // xhr.onload = function (data) {
    // };

    xhr.onreadystatechange = function (res) {
        if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                inParams.callback.success && inParams.callback.success(JSON.parse(xhr.responseText));
            }
            else {
                inParams.callback.failure && inParams.callback.failure({
                    responseText: res.currentTarget.responseText,
                    readyState: res.currentTarget.readyState,
                    status: res.currentTarget.status
                });
            }

            xhr.onreadystatechange = new Function();
            xhr = null;
        }
    };
    xhr.ontimeout = inParams.callback.hasOwnProperty('ontimeout') && inParams.callback.ontimeout;
    xhr.send();
    return xhr;
};

Ajax.prototype.sendGet = function (opts) {
    var ajax = new Ajax();
    ajax.get({
        url: opts.url,
        body: opts.params,
        timeout: opts.timeout || 7000,
        callback: {
            success: function (data) {
                opts.success(data);
            },
            failure: function (data) {
                opts.failure(data);
            },
            ontimeout: function (data) {
                opts.ontimeout && opts.ontimeout(data);
            }
        }
    });
};

Ajax.prototype.sendPost = function (opts) {
    var ajax = new Ajax();
    ajax.post({
        url: opts.url,
        body: JSON.stringify(opts.params),
        timeout: opts.timeout || 7000,
        callback: {
            success: function (data) {
                opts.success(data);
            },
            failure: function (data) {
                opts.failure(data);
            },
            ontimeout: function (data) {
                opts.ontimeout && opts.ontimeout(data);
            }
        }
    });
};
