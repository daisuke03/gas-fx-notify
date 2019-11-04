// Gmail 検索文字列
var SearchString = "is:unread label:fx約定通知 ループイフダン";

// Slack Incoming application
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

      // メール本文から必要な個所を抜粋する
      var mailBody =message.getPlainBody();

      var contractType = mailBody.match(/「ループイフダン」(決済|新規)注文約定のお知らせ/);
      var currency = mailBody.match(/通貨ペア[ :]+([A-Z]{6})/);
      var tradeType = mailBody.match(/売買区分[ :]+(売|買)/);
      var amount = mailBody.match(/数量[ :]+([0-9]+)/);
      var rate = mailBody.match(/約定レート[ :]+([0-9\.]+)/);
      var contractDate = mailBody.match(/約定日時[ :]+([0-9\-: ]+)/);

      // 通知用メッセージを組み立てる
      var msgElem1 = ["ループイフダン", currency[1], contractType[1]];
      var msgElem2 = ["方向:", tradeType[1], "数量:", amount[1], "約定レート:", rate[1]];
      var msgElem3 = ["約定日時:", contractDate[1]];

      // slack incoming api に通知する
      var jsonData = {
            "text" : msgElem1.join(' ') + "\n" + msgElem2.join(' ') + "\n" + msgElem3.join(' ')
          };
      var payload = JSON.stringify(jsonData);
      var options = {
            "method" : "post",
            "contentType" : "application/json",
            "payload" : payload
          };
      UrlFetchApp.fetch(SlackIncomingApiUrl, options);

      // 通知したメッセージは既読にする
      message.markRead();
    })
  })
}
