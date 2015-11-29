/*global $: true*/
"use strict";

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
		};
		reader.readAsDataURL(file);
	});

	$('#contact-form').submit(function(event) {
		// HTMLでの送信をキャンセル
		event.preventDefault();

		// 操作対象のフォーム要素を取得
		var $form = $(this);

		// 送信ボタンを取得
		// （後で使う: 二重送信を防止する。）
		var $button = $('#contact-submit');
		
		// 送信
		$.ajax({
			url: $form.attr('action'),
			type: $form.attr('method'),
			data: $form.serialize(),
			timeout: 10000,  // 単位はミリ秒

			// 送信前
			beforeSend: function(xhr, settings) {
				// ボタンを無効化し、二重送信を防止
				$button.attr('disabled', true);
				$button.attr('value', '送信中…');
			},
			// 応答後
			complete: function(xhr, textStatus) {
				// ボタンを有効化し、再送信を許可
				//$button.attr('disabled', false);
			},

			// 通信成功時の処理
			success: function(result, textStatus, xhr) {
				// 入力値を初期化
				//$form[0].reset();
				setTimeout(function(){ $button.attr('value', 'ありがとうございました！'); }, 500);
			},
		});

		return false;
	});
});

