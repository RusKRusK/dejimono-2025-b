document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".locker-container");

  // モーダル関連の要素取得
  const modalOverlay = document.getElementById("modal-overlay");
  const modalMessage = document.getElementById("modal-message");

  // モーダル操作用関数
  const showModal = (message) => {
    modalMessage.textContent = message;
    modalOverlay.classList.remove("hidden");
  };

  const hideModal = () => {
    modalOverlay.classList.add("hidden");
  };

  try {
    // ---------------------------------------------------
    // 1. [GET] /employees
    // ---------------------------------------------------
    // モーダル表示: 社員証待ち
    showModal("社員証をかざしてください");

    const empRes = await fetch("/employees");

    // 1が200以外の場合
    if (empRes.status !== 200) {
      throw new Error("Employee verification failed");
    }
    alert("社員確認に成功しました");

    // ---------------------------------------------------
    // 2. [GET] /alcohol/check
    // ---------------------------------------------------
    // モーダル更新: アルコールチェック待ち
    showModal("アルコールチェックをしてください");

    const alcRes = await fetch("/alcohol/check");

    // 2が200の場合: ロッカー取得へ進む
    if (alcRes.status === 200) {
      // 処理が進むので一旦モーダルを隠す（あるいは「読込中」などにしてもOK）
      alert("アルコール確認に成功しました");
      hideModal();

      // ---------------------------------------------------
      // 3. [GET] /lockers
      // ---------------------------------------------------
      const lockerRes = await fetch("/lockers");

      if (!lockerRes.ok) {
        throw new Error("Failed to fetch locker data");
      }

      // 4. ロッカーデータの描画
      const lockers = await lockerRes.json();

      container.innerHTML = "";

      lockers.forEach((data) => {
        const lockerDiv = document.createElement("div");
        lockerDiv.className = "locker";
        lockerDiv.dataset.lockerId = data.locker_id;

        const numDiv = document.createElement("div");
        numDiv.className = "locker-number";
        numDiv.textContent = data.locker_id;

        const btn = document.createElement("button");
        btn.className = "borrow-btn";
        if (data.status === "occupation") {
          btn.textContent = "使用中";
          btn.disabled = true;
          lockerDiv.classList.add("occupied");
        } else {
          btn.textContent = "借用";
          btn.disabled = false;
        }

        // ---------------------------------------------------
        // 5. ボタンクリック時の処理 ([POST] /borrowing)
        // ---------------------------------------------------
        btn.addEventListener("click", async () => {
          const allButtons = document.querySelectorAll(".borrow-btn");
          allButtons.forEach((b) => (b.disabled = true));

          // クリックされたボタンをローディング表示にする
          btn.textContent = "";
          const loader = document.createElement("div");
          loader.className = "loader";
          btn.appendChild(loader);

          try {
            await fetch("/borrowing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locker_id: data.locker_id }),
            });
            alert("借用に成功しました");
            window.location.href = "/";
          } catch (postError) {
            console.error("Post error:", postError);
            window.location.href = "/";
          }
        });

        lockerDiv.appendChild(numDiv);
        lockerDiv.appendChild(btn);
        container.appendChild(lockerDiv);
      });
    } else {
      hideModal();
      setTimeout(() => {
        alert("アルコールチェックに失敗しました");
        window.location.href = "/";
      }, 10);
    }
  } catch (error) {
    // エラー発生時はモーダルを消してからアラートを出す
    hideModal();
    console.error("Process failed:", error);

    setTimeout(() => {
      alert("借用処理に失敗しました");
      window.location.href = "/";
    }, 10);
  }
});
