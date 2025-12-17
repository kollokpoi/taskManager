<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Получаем JSON-пейлоад из POST-запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Извлекаем обязательные поля: portal, tg_id и plan (тариф)
$portal = trim($data['portal'] ?? '');
$tg_id  = trim($data['tg_id'] ?? '');
$plan   = trim($data['plan'] ?? '');

// Если хоть одно из обязательных полей не передано, возвращаем ошибку
if (!$portal || !$tg_id || !$plan) {
    echo json_encode([
        "status" => "error",
        "message" => "Не переданы обязательные параметры."
    ]);
    exit;
}

// Формируем payload для передачи боту
$payloadData = [
    'portal'    => $portal,
    'tg_id'     => $tg_id,
    'plan'      => $plan,
    'timestamp' => $data['timestamp'] ?? date('Y-m-d H:i:s')
];

// Кодируем payload в URL-safe Base64
$payload = rtrim(strtr(base64_encode(json_encode($payloadData)), '+/', '-_'), '=');

// Перенаправляем пользователя в Telegram-бота с параметром start
header("Location: https://t.me/Background59_bot?start={$payload}", true, 302);
exit;
?>
