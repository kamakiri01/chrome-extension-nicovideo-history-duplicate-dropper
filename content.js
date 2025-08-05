var holder = new Map();
function run() {
    console.log("run", holder);
    // Check if we're on the correct page
    if (!window.location.href.startsWith('https://www.nicovideo.jp/my/history/video')) {
        return;
    }
    // Get the main container
    var dayChunksContainer = document.querySelector('.VideoWatchHistoryContainer-dayChunks');
    if (!dayChunksContainer)
        return;
    // Get all day chunk elements
    var dayChunks = dayChunksContainer.querySelectorAll('.VideoWatchHistoryContainer-dayChunk');
    dayChunks.forEach(function (chunk) {
        var h2 = dayChunks[0].querySelector("h2");
        if (!h2)
            return;
        var date = h2.textContent;
        var videoMediaObjectList = chunk.querySelector(".VideoMediaObjectList");
        var lists = videoMediaObjectList.querySelectorAll(":scope > div");
        var eLists = Array.from(lists);
        var currents = holder.get(date);
        if (currents) { // 過去の取得が存在する（そのdateのすべてがあるとは限らない）
            eLists.forEach(function (dom) {
                var id = getVideoIdFromDom(dom);
                var currentWrapper = currents.find(function (c) { return c.dom === dom; });
                if (currentWrapper && id) {
                    currentWrapper.id = id;
                }
                else {
                    currents.push({ dom: dom, id: id });
                }
            });
        }
        else {
            holder.set(date, eLists.map(function (dom) { return { dom: dom, id: getVideoIdFromDom(dom) }; }));
        }
    });
    // 2番目以降はdisplay: noneスタイルを、1番はスタイルを消す
    applyDisplayStyle();
}
function applyDisplayStyle() {
    var seenIds = [];
    holder.keys().forEach(function (key) {
        var wrappers = holder.get(key);
        wrappers.forEach(function (wrapper) {
            var id = wrapper.id;
            if (id) {
                if (seenIds.includes(id)) {
                    wrapper.dom.style.display = "none";
                }
                else {
                    wrapper.dom.style.display = undefined;
                }
                seenIds.push(wrapper.id);
            }
        });
    });
}
;
function resetAllDisplayStyle() {
    holder.keys().forEach(function (key) {
        var wrappers = holder.get(key);
        wrappers.forEach(function (wrapper) {
            wrapper.dom.style.display = "";
        });
    });
}
function getVideoIdFromDom(dom) {
    var div = dom.querySelector(":scope > div");
    if (!div)
        return undefined;
    var mediaObject = div.querySelector(".NC-MediaObject-main");
    var url = mediaObject.querySelector("a").href;
    return url;
}
var observer;
function setOberver() {
    var targetNode = document.body; // 監視したい要素。body全体を監視するのが一般的。
    var config = {
        childList: true, // 子ノードの追加や削除を監視
        subtree: true, // targetNodeとその子孫ノードを全て監視
        attributes: true, // 属性の変更を監視
        characterData: true, // テキスト内容の変更を監視
    };
    var callback = function (mutationsList, observer) {
        console.log("callback");
        for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
            var mutation = mutationsList_1[_i];
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
                // ここにDOM更新時に実行したい関数を記述
                // 例: checkDOMChanges();
                run();
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified.');
            }
        }
    };
    observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
    console.log("setOberver done");
}
var isCurrentEnable = false;
// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'toggle') {
        // Update the state
        console.log("request.enabled", request.enabled);
        if (request.enabled) {
            if (!observer)
                setOberver();
            run();
        }
        else {
            resetAllDisplayStyle();
            if (observer) {
                observer.disconnect();
                observer = undefined;
            }
        }
    }
});
window.addEventListener("load", function () {
    console.log("DOMContentLoaded");
    chrome.storage.sync.get(['enabled'], function (result) {
        var isEnabled = result.enabled !== false;
        if (isEnabled && !observer)
            setOberver();
    });
}, false);
