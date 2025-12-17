let jsFrameContainer = null;

function getJsFrameContainer() {
    if (!jsFrameContainer) {
        jsFrameContainer = document.createElement("div");
        jsFrameContainer.style.position = "fixed";
        jsFrameContainer.style.zIndex = "20000000";
        jsFrameContainer.style.top = "0px";
        jsFrameContainer.style.left = "0px";
        jsFrameContainer.style.width = "100%";
        jsFrameContainer.style.height = "0px";
        jsFrameContainer.style.pointerEvents = "none";
        document.body.appendChild(jsFrameContainer);
    }
    return jsFrameContainer;
}

function showToastAndWait(message, duration = 2000) {
    return new Promise((resolve) => {
        const container = getJsFrameContainer();
        const jsFrame = new JSFrame({ parentElement: container });

        jsFrame.showToast({
            html: `<span style="color:white;">${message}</span>`,
            align: "top",
            duration: duration,
            style: {
                pointerEvents: "auto",
                borderRadius: "10px",
                background: "rgb(0,124,255)",
            },
        });
        setTimeout(() => {
            resolve();
        }, duration);
    });
}
