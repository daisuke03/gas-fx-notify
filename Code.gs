// Gmail 検索文字列
var SearchString = "is:unread label:fx約定通知";

// Slack Incoming webhook api url
var SlackIncomingApiUrl = "https://hooks.slack.com/services/xxxxxxxxxxxx/xxxxxxxxxxxxx/xxxxxxxxxxxxxxxxxxxxx";

function myFunction() {

  // Gmailを検索
  var threads = GmailApp.search(SearchString);

  // 全スレッド・全メールを処理
  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    messages.forEach(function(message) {

      // 既読メールは処理しない
      if(!message.isUnread()) {
        return;
      }

      var msgFrom = message.getFrom();
      var mailBody = message.getPlainBody();
      var notifyMsg;

      // 通知メッセージを組み立てる
      if(msgFrom.match(/fx-support@inet-sec.com/)) {
        // アイネット証券向け
        notifyMsg = makeNotifyMsgInet(mailBody);
      } else if(msgFrom.match(/oshirase@m2j.co.jp/)) {
        // マネースクエア向け
        notifyMsg = makeNotifyMsgM2j(mailBody);
      }

      // 通知実行
      doNotify(notifyMsg);

      // 通知したメッセージは既読にする
      message.markRead();
    })
  })
}

function makeNotifyMsgM2j(mailBody) {
  // 必要個所を取り出す
  var contractType = mailBody.match(/区分：(決済|新規)/);
  var currency = mailBody.match(/通貨ペア：([\/円米豪カナダNZドル]+)/);
  var tradeType = mailBody.match(/売買：(売|買)/);
  var amount = mailBody.match(/注文金額：([0-9,]+)/);
  var rate = mailBody.match(/取得価格：([0-9\.]+)/);
  var contractDate = mailBody.match(/成立日時：([0-9\/: ]+)/);

  // 通知用メッセージを組み立てる
  var notifyMsg1 = ["トラリピ", currency[1], contractType[1]];
  var notifyMsg2 = ["方向:", tradeType[1], "数量:", amount[1], "約定レート:", rate[1]];
  var notifyMsg3 = ["約定日時:", contractDate[1]];
  var notifyMsg = notifyMsg1.join(' ') + "\n" + notifyMsg2.join(' ') + "\n" + notifyMsg3.join(' ');

  return notifyMsg;
}

function makeNotifyMsgInet(mailBody) {
  // 必要個所を取り出す
  var contractType = mailBody.match(/「ループイフダン」(決済|新規)注文約定のお知らせ/);
  var currency = mailBody.match(/通貨ペア[ :]+([A-Z]{6})/);
  var tradeType = mailBody.match(/売買区分[ :]+(売|買)/);
  var amount = mailBody.match(/数量[ :]+([0-9]+)/);
  var rate = mailBody.match(/約定レート[ :]+([0-9\.]+)/);
  var contractDate = mailBody.match(/約定日時[ :]+([0-9\-: ]+)/);

  // 通知用メッセージを組み立てる
  var notifyMsg1 = ["ループイフダン", currency[1], contractType[1]];
  var notifyMsg2 = ["方向:", tradeType[1], "数量:", amount[1], "約定レート:", rate[1]];
  var notifyMsg3 = ["約定日時:", contractDate[1]];
  var notifyMsg = notifyMsg1.join(' ') + "\n" + notifyMsg2.join(' ') + "\n" + notifyMsg3.join(' ');

  return notifyMsg;
}

function doNotify(msg) {
  // slack incoming api に通知する
  var jsonData = {
    "text" : msg
  };
  var payload = JSON.stringify(jsonData);
  var options = {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : payload
  };
  UrlFetchApp.fetch(SlackIncomingApiUrl, options);
}
