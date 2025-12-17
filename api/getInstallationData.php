<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Параметры подключения к БД
$dbHost = 'localhost';
$dbName = 'u2400560_market_app';
$dbUser = 'u2400560';
$dbPass = 'kE3kU8yW0gvV6bW1';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Ошибка подключения к БД",
        "error"   => $e->getMessage()
    ]);
    exit;
}

$portal = trim($_GET['portal'] ?? '');
if (!$portal) {
    echo json_encode(["status" => "error", "message" => "Не передан URL портала"]);
    exit;
}

define('APP_KEY', 'app');

$stmt = $pdo->prepare("SELECT * FROM installations WHERE app_key = :app_key AND portal = :portal LIMIT 1");
$stmt->execute([':app_key' => APP_KEY, ':portal' => $portal]);
$record = $stmt->fetch(PDO::FETCH_ASSOC);

if ($record) {
    // Преобразуем поле product из JSON в массив
    $record['product'] = json_decode($record['product'], true);
    echo json_encode([
        "status" => "ok",
        "data"   => $record
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Запись не найдена"
    ]);
}
exit;
?>
