<?php
// Вариант без проверок и плейсхолдеров, чтобы убрать лишние сообщения на странице.

// Если всё же нужна проверка Bitrix, раскомментируйте:
// if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
//     die();
// }

// Жёстко задаём название приложения, чтобы не было Undefined variable
$APP_NAME = "BG59 App";

?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Установка приложения <?php echo $APP_NAME; ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Materialize CSS (через CDN) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" />
  <style>
    body {
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .install-container {
      margin-top: 5rem;
    }
  </style>
</head>
<body>

  <div class="container center-align install-container">
    <div class="card">
      <div class="card-content">
        <span class="card-title">
          Приложение «<?php echo $APP_NAME; ?>» установлено!
        </span>
        <p class="grey-text text-darken-2">
          Краткое описание приложения. Здесь вы можете указать общую информацию 
          о том, что было установлено, и для чего оно предназначено.
        </p>
      </div>
      <div class="card-action">
        <button class="btn waves-effect waves-light" id="finishButton">
          Завершить установку
        </button>
      </div>
    </div>
  </div>

  <!-- API Bitrix24 -->
  <script src="//api.bitrix24.com/api/v1/"></script>
  
  <!-- Materialize JS (если нужно использовать JS-компоненты Materialize) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>

  <script>
    // По нажатию вызываем BX24.installFinish() — Bitrix поймёт, что установка завершена
    document.getElementById('finishButton').addEventListener('click', function() {
      BX24.installFinish();
    });
  </script>

</body>
</html>
