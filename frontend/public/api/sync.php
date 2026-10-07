<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Configuración por defecto de BanaHosting
$db_host = 'localhost';
$db_name = 'zsonbkvb_classflow';
$db_user = 'zsonbkvb_Geramel5010v';
$db_pass = '';

// 2. Cargar config.php si existe
if (file_exists(__DIR__ . '/config.php')) {
    include_once __DIR__ . '/config.php';
}

// 3. Cargar .env si existe en niveles superiores
$env_paths = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    __DIR__ . '/.env'
];
foreach ($env_paths as $env_file) {
    if (file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if ($key === 'DB_PASSWORD' && !empty($val) && $val !== 'TU_CONTRASEÑA') {
                    $db_pass = $val;
                }
                if ($key === 'DB_USER' && !empty($val)) $db_user = $val;
                if ($key === 'DB_NAME' && !empty($val)) $db_name = $val;
                if ($key === 'DB_HOST' && !empty($val)) $db_host = $val;
            }
        }
        break;
    }
}

// 4. Conectar a MySQL
try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Crear tabla si no existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS `system_state` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `state_json` LONGTEXT NOT NULL,
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión MySQL en BanaHosting: ' . $e->getMessage(),
        'hint' => 'Configura la contraseña de tu base de datos en api/config.php o en .env'
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: Recuperar el estado central para todos los dispositivos
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT state_json FROM system_state WHERE id = 'master_state'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && !empty($row['state_json'])) {
            $data = json_decode($row['state_json'], true);
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            echo json_encode(['success' => false, 'data' => null]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}

// POST: Guardar cambios desde cualquier dispositivo hacia MySQL
if ($method === 'POST') {
    try {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No se recibieron datos']);
            exit();
        }
        $decoded = json_decode($raw, true);
        if ($decoded === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Formato JSON inválido']);
            exit();
        }

        // Fusionar usuarios CUENTA POR CUENTA (gana el updatedAt más reciente de cada id)
        $stmtOld = $pdo->prepare("SELECT state_json FROM system_state WHERE id = 'master_state'");
        $stmtOld->execute();
        $rowOld = $stmtOld->fetch();
        if ($rowOld && !empty($rowOld['state_json'])) {
            $old = json_decode($rowOld['state_json'], true);
            if (is_array($old)) {
                $deleted = array_values(array_unique(array_merge(
                    isset($old['deletedUserIds']) && is_array($old['deletedUserIds']) ? $old['deletedUserIds'] : [],
                    isset($decoded['deletedUserIds']) && is_array($decoded['deletedUserIds']) ? $decoded['deletedUserIds'] : []
                )));
                $map = [];
                $lists = [
                    isset($old['users']) && is_array($old['users']) ? $old['users'] : [],
                    isset($decoded['users']) && is_array($decoded['users']) ? $decoded['users'] : []
                ];
                foreach ($lists as $list) {
                    foreach ($list as $u) {
                        if (!is_array($u) || empty($u['id']) || in_array($u['id'], $deleted, true)) continue;
                        $ts = isset($u['updatedAt']) ? $u['updatedAt'] : 0;
                        $prevTs = isset($map[$u['id']]['updatedAt']) ? $map[$u['id']]['updatedAt'] : -1;
                        if (!isset($map[$u['id']]) || $ts > $prevTs) $map[$u['id']] = $u;
                    }
                }
                $decoded['users'] = array_values($map);
                $decoded['deletedUserIds'] = $deleted;
                $raw = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
        }

        $stmt = $pdo->prepare("INSERT INTO system_state (id, state_json, updated_at) 
            VALUES ('master_state', :json, NOW()) 
            ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = NOW()");
        $stmt->execute([':json' => $raw]);

        echo json_encode(['success' => true, 'message' => 'Base de datos en BanaHosting sincronizada']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit();
}
