<?php
session_start();

// Получаем productId из GET или POST
$productId = 0;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $productId = isset($_POST['productId']) ? intval($_POST['productId']) : 0;
} else {
    $productId = isset($_GET['productId']) ? intval($_GET['productId']) : 0;
}
if ($productId <= 0) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Некорректный идентификатор продукта']);
    exit;
}

// Настройки подключения к базе данных
$dbHost = 'localhost';
$dbName = 'u2400560_our_solutions';
$dbUser = 'u2400560';
$dbPass = 'kE3kU8yW0gvV6bW1';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    die(json_encode(['error' => "Ошибка подключения: " . $e->getMessage()]));
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'update_like') {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        // Параметр liked: true если пользователь ставит лайк, false — снимает лайк.
        $liked = isset($_POST['liked']) && $_POST['liked'] === 'true' ? true : false;
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Некорректный идентификатор функционала']);
            exit;
        }
        
        if ($liked) {
            // Если пользователь ставит лайк, увеличиваем счетчик
            $stmt = $pdo->prepare("UPDATE planned_features SET likes = likes + 1 WHERE id = ? AND product_id = ?");
            $stmt->execute([$id, $productId]);
        } else {
            // Если пользователь убирает лайк, уменьшаем счетчик, но не опускаем его ниже 0
            $stmt = $pdo->prepare("UPDATE planned_features SET likes = IF(likes > 0, likes - 1, 0) WHERE id = ? AND product_id = ?");
            $stmt->execute([$id, $productId]);
        }
        
        // Получаем обновлённое значение лайков
        $stmt = $pdo->prepare("SELECT likes FROM planned_features WHERE id = ? AND product_id = ?");
        $stmt->execute([$id, $productId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'likes' => $result ? $result['likes'] : 0]);
        exit;
    } else {
        echo json_encode(['success' => false, 'message' => 'Неверное действие']);
        exit;
    }
} else {
    // GET-запрос — получение данных для history_items и planned_features по productId
    try {
        $stmtHistory = $pdo->prepare("SELECT * FROM history_items WHERE product_id = ?");
        $stmtHistory->execute([$productId]);
        $historyItems = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);
        
        $stmtPlanned = $pdo->prepare("SELECT * FROM planned_features WHERE product_id = ?");
        $stmtPlanned->execute([$productId]);
        $plannedFeatures = $stmtPlanned->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'historyItems'    => $historyItems,
            'plannedFeatures' => $plannedFeatures,
        ]);
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
