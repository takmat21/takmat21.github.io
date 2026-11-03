/**
 * 見本B：在庫が減ったら知らせる
 * 在庫表（商品名・在庫数・下限）を毎朝読み、下限を下回った商品を
 * まとめて1通のメールで知らせます。下回った商品がなければ送りません。
 *
 * 使い方：在庫表のあるスプレッドシートの［拡張機能］→［Apps Script］に貼り付け、
 * 一度 setupTrigger を実行すると毎朝自動で動きます。
 */

// ===== 設定（ここだけ書き換えてください） =====
const CONFIG = {
  SHEET_NAME: '在庫',      // 在庫表のシート名
  NOTIFY_TO: '',           // 通知の宛先メールアドレス。空欄ならこのスクリプトを実行する本人宛て
  HOUR: 8,                 // 毎朝何時ごろに確認するか（0〜23）
  // 列の位置（A列=1）。1行目は見出し、2行目から商品が並ぶ前提です
  COL_NAME: 1,             // 商品名
  COL_STOCK: 2,            // 在庫数
  COL_MIN: 3,              // 下限
};
// ============================================

/** 毎朝動かす本体 */
function checkStock() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('シート「' + CONFIG.SHEET_NAME + '」が見つかりません。');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const width = Math.max(CONFIG.COL_NAME, CONFIG.COL_STOCK, CONFIG.COL_MIN);
  const values = sheet.getRange(2, 1, lastRow - 1, width).getValues();

  const low = [];
  values.forEach(function (row) {
    const name = String(row[CONFIG.COL_NAME - 1]).trim();
    const stock = row[CONFIG.COL_STOCK - 1];
    const min = row[CONFIG.COL_MIN - 1];
    if (!name || stock === '' || min === '') return;        // 空欄の行は飛ばす
    if (isNaN(Number(stock)) || isNaN(Number(min))) return; // 数字でない行は飛ばす
    if (Number(stock) < Number(min)) {
      low.push('・' + name + '：在庫 ' + stock + '（下限 ' + min + '）');
    }
  });

  if (low.length === 0) return; // 問題なければ送らない

  const to = CONFIG.NOTIFY_TO || Session.getEffectiveUser().getEmail();
  const subject = '【在庫通知】下限を下回った商品が ' + low.length + ' 件あります';
  const body = '下限を下回っている商品は次のとおりです。\n\n' +
    low.join('\n') + '\n\n在庫表：' + ss.getUrl();
  MailApp.sendEmail(to, subject, body);
}

/** 最初に1回だけ実行：毎朝のトリガーを登録する */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkStock') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkStock').timeBased().everyDays(1).atHour(CONFIG.HOUR).create();
}
