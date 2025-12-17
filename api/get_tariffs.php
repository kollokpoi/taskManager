<?php
header('Content-Type: application/json; charset=utf-8');

$dbHost = 'localhost';
$dbUser = 'u2400560';
$dbPass = 'kE3kU8yW0gvV6bW1';
$dbName = 'u2400560_our_solutions';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT id, tariff_name AS name, price AS priceValue, billing, description, popular, features, cta, tariff_key FROM tariffs ORDER BY id");
    $tariffs = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['popular'] = boolval($row['popular']);
        $row['features'] = json_decode($row['features'], true);
        $tariffs[] = $row;
    }

    echo json_encode(['status' => 'success', 'plans' => $tariffs]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'plans' => []
    ]);
}
