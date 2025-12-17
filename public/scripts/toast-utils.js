let customToastContainer = null;

function getToastContainer() {
    if (!customToastContainer) {
        customToastContainer = document.createElement("div");
        customToastContainer.id = "custom-toast-container";
        customToastContainer.style.position = "fixed";
        customToastContainer.style.zIndex = "20000000";
        customToastContainer.style.top = "20px";
        customToastContainer.style.left = "50%";
        customToastContainer.style.transform = "translateX(-50%)";
        customToastContainer.style.width = "auto";
        customToastContainer.style.display = "flex";
        customToastContainer.style.flexDirection = "column";
        customToastContainer.style.alignItems = "center";
        customToastContainer.style.pointerEvents = "none"; // Container clicks pass through
        document.body.appendChild(customToastContainer);
    }
    return customToastContainer;
}

function showToastAndWait(message, isError = false, duration = 2000) {
    return new Promise((resolve) => {
        const container = getToastContainer();

        const toast = document.createElement("div");
        toast.textContent = message;

        toast.style.background = isError
            ? "rgba(255, 0, 0, 0.9)"
            : "rgba(34, 156, 30, 0.9)";
        toast.style.color = "white";
        toast.style.padding = "10px 20px";
        toast.style.borderRadius = "10px";
        toast.style.marginTop = "10px";
        toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
        toast.style.fontSize = "16px";
        toast.style.fontWeight = "bold";
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        toast.style.transform = "translateY(-20px)";
        toast.style.pointerEvents = "auto";

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-20px)";

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                resolve();
            }, 300);
        }, duration);
    });
}
