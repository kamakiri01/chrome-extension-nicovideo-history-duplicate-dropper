interface VideoDoWrapper {
    dom: HTMLDivElement;
    id?: string;
}

// VideoWrapperDom[]内部は順不同でいい。keyが順序保証されていればよい
type HistoryHolder = Map<string, VideoDoWrapper[]> // key: 日付

const holder: HistoryHolder = new Map();

function run() {
    // Check if we're on the correct page
    if (!window.location.href.startsWith("https://www.nicovideo.jp/my/history/video")) {
        return;
    }

    // Get the main container
    const dayChunksContainer = document.querySelector(".VideoWatchHistoryContainer-dayChunks");
    if (!dayChunksContainer) return;

    // Get all day chunk elements
    const dayChunks = dayChunksContainer.querySelectorAll(".VideoWatchHistoryContainer-dayChunk");

    dayChunks.forEach(chunk => {
        const h2 = dayChunks[0].querySelector("h2");
        if (!h2) return;
        const date = h2.textContent;
        const videoMediaObjectList = chunk.querySelector(".VideoMediaObjectList");
        const lists = videoMediaObjectList.querySelectorAll(":scope > div");
        const eLists: HTMLDivElement[] = Array.from(lists) as HTMLDivElement[];

        let currents: VideoDoWrapper[] = holder.get(date);
        if (currents) { // 過去の取得が存在する（そのdateのすべてがあるとは限らない）
            eLists.forEach(dom => {
                const id = getVideoIdFromDom(dom);
                const currentWrapper: VideoDoWrapper | undefined = currents.find(c => c.dom === dom);
                if (currentWrapper && id) {
                    currentWrapper.id = id;
                } else {
                    currents.push({ dom, id })
                }
            });
        } else {
            holder.set(
                date,
                eLists.map(dom => { return { dom, id: getVideoIdFromDom(dom) } })
            );
        }
    });

    // 2番目以降はdisplay: noneスタイルを、1番はスタイルを消す
    applyDisplayStyle();
}

function applyDisplayStyle(): void {
    const seenIds: string[] = [];
    holder.keys().forEach(key => {
        const wrappers = holder.get(key);
        wrappers.forEach(wrapper => {
            const id = wrapper.id;
            if (id) {
                if (seenIds.includes(id)) {
                    wrapper.dom.style.display = "none"
                } else {
                    wrapper.dom.style.display = undefined;
                }
                seenIds.push(wrapper.id);
            }
        });
    });
};

function resetAllDisplayStyle(): void {
    holder.keys().forEach(key => {
        const wrappers = holder.get(key);
        wrappers.forEach(wrapper => {
            wrapper.dom.style.display = "";
        });
    });
}

function getVideoIdFromDom(dom: HTMLDivElement): string | undefined {
    const div = dom.querySelector(":scope > div");
    if (!div) return undefined;
    const mediaObject = div.querySelector(".NC-MediaObject-main");
    const url = mediaObject.querySelector("a").href;
    return url;
}

let observer: MutationObserver;
function setOberver() {
    const targetNode = document.body; // 監視したい要素。body全体を監視するのが一般的。
    const config = {
        childList: true, // 子ノードの追加や削除を監視
        subtree: true, // targetNodeとその子孫ノードを全て監視
        attributes: true, // 属性の変更を監視
        characterData: true, // テキスト内容の変更を監視
    };

    const callback = function (mutationsList: any, observer: any) {
        console.log("callback");
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                run();
            } else if (mutation.type === "attributes") {
                console.log(`The ${mutation.attributeName}  attribute was modified.`);
            }
        }
    };

    observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
    console.log("setOberver done");
}

let isCurrentEnable = false;
// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "toggle") {
        if (request.enabled) {
            if (!observer) setOberver();
            run();
        } else {
            resetAllDisplayStyle();
            if (observer) {
                observer.disconnect();
                observer = undefined;
            }
        }
    }
});

window.addEventListener("load", () => {
    console.log("DOMContentLoaded");
    chrome.storage.sync.get(["enabled"], function (result) {
        const isEnabled = result.enabled !== false;
        if (isEnabled && !observer) setOberver();
    });
}, false);