/**
 * 見本A：問い合わせメールを表に自動で記録
 * Gmailの特定ラベルが付いたメールを読み、スプレッドシートに1通1行で書き足します。
 * 同じメールは二度書きません（メッセージIDで判定）。
 *
 * 使い方：スプレッドシートの［拡張機能］→［Apps Script］に貼り付け、
 * 一度 setupTrigger を実行すると15分ごとに自動で動きます。
 */

// ===== 設定（ここだけ書き換えてください） =====
const CONFIG = {
  LABEL_NAME: '問い合わせ',       // 記録したいメールに付けるGmailのラベル名
  SHEET_NAME: '問い合わせ記録',   // 書き込むシート名（なければ自動で作ります）
  BODY_LENGTH: 200,               // 本文の冒頭を何文字まで記録するか
  MAX_THREADS: 50,                // 1回の実行で見るスレッド数の上限
};
// ============================================

const HEADERS = ['受信日時', '差出人', '件名', '本文（冒頭）', 'メッセージID'];
const ID_COLUMN = 5; // メッセージIDを入れる列（E列）

/** 15分ごとに動かす本体 */
function recordInquiries() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // 前の実行がまだ続いていたら今回は見送る
  try {
    const label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
    if (!label) {
      throw new Error('ラベル「' + CONFIG.LABEL_NAME + '」が見つかりません。Gmailで作成してください。');
    }

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();

    // すでに記録したメッセージIDの一覧
    const known = new Set();
    if (lastRow > 1) {
      sheet.getRange(2, ID_COLUMN, lastRow - 1, 1).getValues()
        .forEach(function (r) { known.add(String(r[0])); });
    }

    const newRows = [];
    label.getThreads(0, CONFIG.MAX_THREADS).forEach(function (thread) {
      thread.getMessages().forEach(function (msg) {
        const id = msg.getId();
        if (known.has(id)) return; // 記録済みは飛ばす
        known.add(id);
        const body = msg.getPlainBody().replace(/\s+/g, ' ').trim().slice(0, CONFIG.BODY_LENGTH);
        newRows.push([msg.getDate(), msg.getFrom(), msg.getSubject(), body, id]);
      });
    });

    if (newRows.length === 0) return;
    newRows.sort(function (a, b) { return a[0] - b[0]; }); // 古い順に並べる
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, HEADERS.length).setValues(newRows);
  } finally {
    lock.releaseLock();
  }
}

/** 書き込み先のシートを返す（なければ作って見出しを入れる） */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** 最初に1回だけ実行：15分ごとのトリガーを登録する */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'recordInquiries') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('recordInquiries').timeBased().everyMinutes(15).create();
}
