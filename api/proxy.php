<?php
// Apps/otchet_tasks_manager/proxy.php
header('Content-Type: application/json');

// Настройка CORS - разрешаем только ваш домен и поддомены
$allowedOrigins = [
    'https://bg59.online',
    'http://bg59.online',
    'https://www.bg59.online'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400'); // 24 часа для preflight

// Обработка preflight запроса (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Разрешаем только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Только POST метод разрешен']);
    exit();
}

// Получаем JSON данные
$jsonInput = file_get_contents('php://input');
$input = json_decode($jsonInput, true);

// Валидация
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный JSON формат: ' . json_last_error_msg()]);
    exit();
}

if (empty($input['method'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Отсутствует обязательный параметр: method']);
    exit();
}

if (empty($input['appData']) || empty($input['appData']['auth'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Отсутствуют данные авторизации в appData']);
    exit();
}

// Извлекаем данные
$method = trim($input['method']);
$params = $input['params'] ?? [];
$appData = $input['appData'];
$auth = $appData['auth'];

// Валидация auth данных
if (empty($auth['domain']) || empty($auth['access_token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'В auth отсутствует domain или access_token']);
    exit();
}

// Подготовка запроса к Bitrix24
$domain = rtrim($auth['domain'], '/');
$accessToken = trim($auth['access_token']);

// Определяем тип запроса (вебхук или OAuth)
$isWebhook = strpos($accessToken, '/') !== false;

if ($isWebhook) {
    // Формат вебхука: https://domain/rest/1/token/method
    $bitrixUrl = "https://{$domain}/rest/{$accessToken}/{$method}";
    $headers = ['Content-Type: application/json'];
} else {
    // OAuth формат: https://domain/rest/method с Bearer токеном
    $bitrixUrl = "https://{$domain}/rest/{$method}";
    $headers = [
        'Content-Type: application/json',
        "Authorization: Bearer {$accessToken}"
    ];
}

// Логирование для отладки (можно удалить в продакшене)
error_log("Bitrix Proxy: Calling {$method} to {$domain}");

// Выполнение запроса через cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $bitrixUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($params),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_ENCODING => 'gzip, deflate',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);

curl_close($ch);

// Обработка ошибок cURL
if ($curlErrno) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Ошибка подключения к Bitrix24',
        'details' => $curlError,
        'errno' => $curlErrno
    ]);
    exit();
}

// Передаем HTTP код от Bitrix24
http_response_code($httpCode);

// Проверяем, не вернул ли Bitrix24 ошибку в JSON
$decodedResponse = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE && isset($decodedResponse['error'])) {
    // Bitrix24 вернул ошибку в своем формате
    echo $response;
    exit();
}

// Возвращаем успешный ответ
echo $response;
?>