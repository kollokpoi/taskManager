<?php
header('Content-Type: application/json; charset=utf-8');

// Параметры БД subscriptions
$host_subscriptions = 'localhost';
$user_subscriptions = 'u2400560';
$pass_subscriptions = 'kE3kU8yW0gvV6bW1';
$db_subscriptions = 'u2400560_market_app';

// Параметры БД tariffs
$host_tariffs = 'localhost';
$user_tariffs = 'u2400560';
$pass_tariffs = 'kE3kU8yW0gvV6bW1';
$db_tariffs = 'u2400560_our_solutions';

// Проверка входящего параметра
if (!isset($_GET['portal'])) {
    echo json_encode(["status" => "error", "message" => "Portal is required"]);
    exit;
}

$portal = trim($_GET['portal']);

try {
    // Подключение к subscriptions
    $pdo_subscriptions = new PDO(
        "mysql:host=$host_subscriptions;dbname=$db_subscriptions;charset=utf8",
        $user_subscriptions,
        $pass_subscriptions
    );
    $pdo_subscriptions->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Запрос подписки
    $stmt = $pdo_subscriptions->prepare("SELECT product, tariff_id FROM subscriptions WHERE portal = :portal");
    $stmt->execute([':portal' => $portal]);
    $subscription = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$subscription) {
        echo json_encode(["status" => "ok", "has_subscription" => false]);
        exit;
    }

    $solution_id = $subscription['product'];
    $tariff_id = $subscription['tariff_id'];

    // Подключение к tariffs (our_solutions)
    $pdo_tariffs = new PDO(
        "mysql:host=$host_tariffs;dbname=$db_tariffs;charset=utf8",
        $user_tariffs,
        $pass_tariffs
    );
    $pdo_tariffs->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ищем запись с нужным tariff_id и solution_id
    $stmt = $pdo_tariffs->prepare("SELECT tariff_key FROM tariffs WHERE id = :tariff_id AND solution_id = :solution_id");
    $stmt->execute([':tariff_id' => $tariff_id, ':solution_id' => $solution_id]);
    $tariff_info = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tariff_info) {
        echo json_encode(["status" => "error", "message" => "Tariff info not found"]);
        exit;
    }

    // Вернём tariff_key
    echo json_encode([
        "status" => "ok",
        "has_subscription" => true,
        "tariff_key" => $tariff_info['tariff_key']
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
