/**
 * 見本C：注文メールから出荷用の表を作る
 * Gmailの特定ラベルが付いた注文通知メールを読み、スプレッドシートに1注文1行で書き足します。
 * 同じ注文は二度書きません（注文番号で判定）。読み取れなかった項目は空欄にして「要確認」列に印を付けます。
 * 関数 exportCsv を実行すると、その表をCSVにしてGoogleドライブに保存します。
 *
 * 使い方：スプレッドシートの［拡張機能］→［Apps Script］に貼り付け、
 * 一度 setupTrigger を実行すると15分ごとに自動で動きます。
 *
 * 注意：氏名・住所・電話番号などの個人情報を扱います。表とCSVの共有範囲は必要な人だけにしてください。
 */

// ===== 設定（ここだけ書き換えてください） =====
const CONFIG = {
  LABEL_NAME: '注文',             // 記録したい注文メールに付けるGmailのラベル名
  SHEET_NAME: '出荷表',           // 書き込むシート名（なければ自動で作ります）
  MAX_THREADS: 50,                // 1回の実行で見るスレッド数の上限
  EXPORT_FOLDER_ID: '',           // CSVの保存先フォルダのID。空欄ならマイドライブの直下
  // 読み取りのパターン。メール本文の1行を読み、かっこ ( ) の中身を取り出します。
  // メールの書き方が違う場合は、ここだけ書き換えます（全角の「：」も半角の「:」も読めます）。
  PATTERNS: {
    orderNo: /^\s*注文番号\s*[：:]\s*(.+?)\s*$/m,
    name:    /^\s*お名前\s*[：:]\s*(.+?)\s*$/m,
    zip:     /^\s*郵便番号\s*[：:]\s*(.+?)\s*$/m,
    address: /^\s*住所\s*[：:]\s*(.+?)\s*$/m,
    phone:   /^\s*電話番号\s*[：:]\s*(.+?)\s*$/m,
    item:    /^\s*商品\s*[：:]\s*(.+?)\s*$/m,
    qty:     /^\s*数量\s*[：:]\s*(.+?)\s*$/m,
  },
};
// ============================================

// 表の見出し（読み取る項目の順番と、項目の表示名）
const FIELDS = [
  ['orderNo', '注文番号'],
  ['name', 'お名前'],
  ['zip', '郵便番号'],
  ['address', '住所'],
  ['phone', '電話番号'],
  ['item', '商品'],
  ['qty', '数量'],
];
const HEADERS = ['受信日時'].concat(
  FIELDS.map(function (f) { return f[1]; }),
  ['要確認', 'メッセージID']
);
const ORDER_COLUMN = 2;                 // 注文番号の列（B列）
const ID_COLUMN = HEADERS.length;       // メッセージIDの列（最後の列）
const TEXT_COLUMNS = [2, 4, 6];         // 先頭の0が消えないよう文字列で入れる列（注文番号・郵便番号・電話番号）

/** 15分ごとに動かす本体 */
function recordOrders() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // 前の実行がまだ続いていたら今回は見送る
  try {
    const label = GmailApp.getUserLabelByName(CONFIG.LABEL_NAME);
    if (!label) {
      throw new Error('ラベル「' + CONFIG.LABEL_NAME + '」が見つかりません。Gmailで作成してください。');
    }

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();

    // すでに記録した注文番号（注文番号が読めなかったメールはメッセージID）の一覧
    const known = new Set();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues().forEach(function (r) {
        if (r[ORDER_COLUMN - 1] !== '') known.add(String(r[ORDER_COLUMN - 1]));
        known.add(String(r[ID_COLUMN - 1]));
      });
    }

    const newRows = [];
    label.getThreads(0, CONFIG.MAX_THREADS).forEach(function (thread) {
      thread.getMessages().forEach(function (msg) {
        const id = msg.getId();
        const parsed = parseOrder_(msg.getPlainBody());
        const key = parsed.orderNo || id;
        if (known.has(key) || known.has(id)) return; // 記録済みは飛ばす
        known.add(key);
        known.add(id);
        const missing = FIELDS
          .filter(function (f) { return parsed[f[0]] === ''; })
          .map(function (f) { return f[1]; });
        const flag = missing.length ? '要確認：' + missing.join('・') : '';
        const row = [msg.getDate()]
          .concat(FIELDS.map(function (f) { return parsed[f[0]]; }), [flag, id]);
        newRows.push(row);
      });
    });

    if (newRows.length === 0) return;
    newRows.sort(function (a, b) { return a[0] - b[0]; }); // 古い順に並べる
    const startRow = sheet.getLastRow() + 1;
    const range = sheet.getRange(startRow, 1, newRows.length, HEADERS.length);
    TEXT_COLUMNS.forEach(function (c) {
      sheet.getRange(startRow, c, newRows.length, 1).setNumberFormat('@'); // 文字列にして先頭の0を残す
    });
    sheet.getRange(startRow, 1, newRows.length, 1).setNumberFormat('yyyy/MM/dd HH:mm');
    range.setValues(newRows);
  } finally {
    lock.releaseLock();
  }
}

/** メール本文から各項目を読み取る（読めなかった項目は空欄） */
function parseOrder_(body) {
  const text = String(body).replace(/\r\n?/g, '\n');
  const result = {};
  FIELDS.forEach(function (f) {
    const m = CONFIG.PATTERNS[f[0]].exec(text);
    result[f[0]] = m ? m[1].trim() : '';
  });
  return result;
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

/** 表をCSVにしてGoogleドライブに保存する（必要なときに手で実行） */
function exportCsv() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) throw new Error('書き出す注文がありません。');

  const tz = Session.getScriptTimeZone();
  const values = sheet.getDataRange().getValues();
  const lines = values.map(function (row) {
    return row.map(function (cell) {
      const s = cell instanceof Date ? Utilities.formatDate(cell, tz, 'yyyy/MM/dd HH:mm') : String(cell);
      return '"' + s.replace(/"/g, '""') + '"'; // 全項目を引用符で囲み、中の引用符は2つにする
    }).join(',');
  });

  // 先頭にBOMを付けると、Excelでも日本語が文字化けしにくい
  const csv = '﻿' + lines.join('\r\n');
  const name = '出荷表_' + Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmm') + '.csv';
  const file = CONFIG.EXPORT_FOLDER_ID
    ? DriveApp.getFolderById(CONFIG.EXPORT_FOLDER_ID).createFile(name, csv, MimeType.CSV)
    : DriveApp.createFile(name, csv, MimeType.CSV);
  Logger.log('保存しました：' + file.getUrl());
}

/** 最初に1回だけ実行：15分ごとのトリガーを登録する */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'recordOrders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('recordOrders').timeBased().everyMinutes(15).create();
}
