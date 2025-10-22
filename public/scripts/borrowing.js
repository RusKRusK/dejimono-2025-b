document.addEventListener('DOMContentLoaded', () => {
    // すべての借用ボタンを取得
    const buttons = document.querySelectorAll('.borrow-btn');

    // 各ボタンにクリックイベントリスナーを追加
    buttons.forEach(button => {
        button.addEventListener('click', (event) => {
            
            // クリックされたボタンの親要素（.locker）を取得
            const locker = event.target.closest('.locker');
            
            // .locker要素から data-locker-id の値を取得
            const lockerId = locker.dataset.lockerId;

            // TODO: ここに将来的に借用ロジックを追加します
            
            // 現状はコンソールにログを出力するだけ
            console.log(`ロッカー ${lockerId} の借用ボタンがクリックされました。`);

            // (参考) 借用中の状態をUIに反映させる例
            // locker.classList.toggle('borrowed');
            // if (locker.classList.contains('borrowed')) {
            //     event.target.textContent = '返却';
            // } else {
            //     event.target.textContent = '借用';
            // }
        });
    });
});