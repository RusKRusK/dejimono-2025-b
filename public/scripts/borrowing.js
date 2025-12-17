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

    const empRes = await fetch("/borrowing/employees", { cache: "no-store" });
    const employeeData = await empRes.json();

    if (empRes.status !== 200) {
      throw new Error(employeeData.message);
    }
    alert("社員確認に成功しました");

    // ---------------------------------------------------
    // 2. [GET] /alcohol/check
    // ---------------------------------------------------
    // モーダル更新: アルコールチェック待ち
    showModal("アルコールチェックをしてください");

    const alcRes = await fetch(`/alcohol/check/${employeeData.employee_id}`, {
      cache: "no-store",
    });

    if (alcRes.status === 200) {
      alert("アルコール確認に成功しました");
      hideModal();

      // ---------------------------------------------------
      // 3. [GET] /lockers
      // ---------------------------------------------------
      const lockerRes = await fetch("/lockers");

      if (!lockerRes.ok) {
        throw new Error("ロッカーデータの取得に失敗しました");
      }

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
            const postRes = await fetch("/borrowing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employee_id: employeeData.employee_id,
                employee_name: employeeData.employee_name,
                locker_id: data.locker_id,
              }),
            });
            if (postRes.ok) {
              alert("借用に成功しました");
              window.location.href = "/";
            } else {
              // サーバーからエラーが返された場合
              const errorMsg = (await postRes.text()) || "借用に失敗しました";
              alert(errorMsg);
              window.location.href = "/";
            }
          } catch (postError) {
            console.error("Post error:", postError);
            alert("借用処理に失敗しました");
            window.location.href = "/";
          }
        });

        lockerDiv.appendChild(numDiv);
        lockerDiv.appendChild(btn);
        container.appendChild(lockerDiv);
      });
    } else if (alcRes.status === 403) {
      hideModal();
      setTimeout(() => {
        alert("アルコールを検知しました。社用車を借用することはできません。");
        window.location.href = "/";
      }, 100);
    } else {
      hideModal();
      setTimeout(() => {
        alert("アルコールチェックに失敗しました");
        window.location.href = "/";
      }, 100);
    }
  } catch (error) {
    // エラー発生時はモーダルを消してからアラートを出す
    hideModal();
    console.error("Process failed:", error);

    setTimeout(() => {
      alert(error.message);
      window.location.href = "/";
    }, 100);
  }
});
