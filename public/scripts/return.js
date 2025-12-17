document.addEventListener("DOMContentLoaded", () => {
  const returnBtn = document.getElementById("return-button");

  // モーダル関連要素
  const modalOverlay = document.getElementById("modal-overlay");
  const modalMessage = document.getElementById("modal-message");

  // モーダル操作関数
  const showModal = (message) => {
    modalMessage.textContent = message;
    modalOverlay.classList.remove("hidden");
  };

  const hideModal = () => {
    modalOverlay.classList.add("hidden");
  };

  // --- 返却ボタンの処理 ---
  returnBtn.addEventListener("click", async () => {
    try {
      // モーダル表示
      showModal("社員証をかざしてください");

      // 社員確認リクエスト ([GET] /employees)
      const empRes = await fetch("/employees");

      if (empRes.status !== 200) {
        throw new Error("社員確認に失敗しました");
      }

      const empData = await empRes.json();
      const employeeId = empData.employee_id;

      if (!employeeId) {
        throw new Error("社員IDが取得できませんでした");
      }

      showModal("返却処理中...");

      // 返却リクエスト ([POST] /return/:employeeId)
      const returnRes = await fetch(`/return/${employeeId}`, {
        method: "POST",
      });

      if (!returnRes.ok) {
        throw new Error("返却処理に失敗しました");
      }

      // 完了後の処理
      hideModal();
      await showToastAndWait("返却が完了しました");

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      hideModal();
      setTimeout(async () => {
        await showToastAndWait("エラーが発生しました: " + error.message);
        window.location.href = "/";
      }, 100);
    }
  });
});
