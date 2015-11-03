$(function() {
  // アップロードするファイルを選択
  $('input[type=file]').change(function() {
    var file = $(this).prop('files')[0];

    // 画像以外は処理を停止
    if (! file.type.match('image.*')) {
      // クリア
      $(this).val('');
      $('#thumbnail').attr('src', '/img/noimage.gif');
      return;
    }

    // 画像表示
    var reader = new FileReader();
    reader.onload = function() {
      $('#thumbnail').attr('src', reader.result);
    }
    reader.readAsDataURL(file);
  });
});

