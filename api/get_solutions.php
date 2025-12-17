<?php
// Разрешим вывод в формате JSON
header("Content-Type: application/json; charset=UTF-8");

// Укажите параметры подключения к вашей базе данных
$host = 'localhost';       // Или адрес хостинга MySQL
$db   = 'u2400560_our_solutions'; // Имя БД
$user = 'u2400560';   // Ваш пользователь БД
$pass = 'kE3kU8yW0gvV6bW1';        // Пароль

try {
    // Создаём соединение
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Выполняем запрос к таблице solutions
    $sql = "SELECT * FROM solutions";
    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Преобразуем поля features и tags из JSON-строки в массив (если надо)
    foreach ($results as $key => $row) {
        if (!empty($row['features'])) {
            $results[$key]['features'] = json_decode($row['features'], true);
        }
        if (!empty($row['tags'])) {
            $results[$key]['tags'] = json_decode($row['tags'], true);
        }
    }

    // Отдаём JSON
    echo json_encode($results);

} catch (PDOException $e) {
    // Если произошла ошибка подключения/запроса
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}
