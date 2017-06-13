(function () {
    function get_browser() {
        var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return { name: 'IE', version: tem[1] || '' };
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR|Edge\/(\d+)/);
            if (tem !== null) { return { name: 'Edge', version: tem[1] }; }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) !== null) { M.splice(1, 1, tem[1]); }
        return {
            name: M[0],
            version: M[1]
        };
    }

    function Load_Script(es5, esNext) {
        const browser = get_browser();
        const list = [{ name: "Chrome", v: "52" }, { name: "Edge", v: "14" }, { name: "Opera", v: "38" }, { name: "Firefox", v: "52" }, { name: "Safari", v: "10.1" }];
        for (let index = 0; index < list.length; index++) {
            if (browser.name === list[index].name) {
                browser.version >= list[index].v ? createScript(esNext) : createScript(es5);
                return;
            }
        }
        createScript(es5);
    }

    function createScript(url) {
        const element = document.createElement("script");
        element.setAttribute("type", "text/javascript");
        element.setAttribute("src", url);
        //element.setAttribute("defer", "");
        document.getElementsByTagName("head")[0].appendChild(element);
    }
    Load_Script("Scripts/app/dist/app.min.js", "Scripts/app/dist/app.js");
})();