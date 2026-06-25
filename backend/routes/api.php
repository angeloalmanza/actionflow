<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

// ⚠️ ROTTA DIAGNOSTICA TEMPORANEA — rimuovere dopo aver risolto Redis.
// Mostra l'errore reale di connessione a Redis (password mascherata).
Route::get('_debug/redis', function () {
    $cfg = config('database.redis.default');
    $info = [
        'client' => config('database.redis.client'),
        'scheme' => $cfg['scheme'] ?? null,
        'host'   => $cfg['host'] ?? null,
        'port'   => $cfg['port'] ?? null,
        'username' => $cfg['username'] ?? null,
        'has_password' => ! empty($cfg['password']),
        'url_set' => ! empty($cfg['url']),
        'queue_connection' => config('queue.default'),
    ];

    try {
        $pong = \Illuminate\Support\Facades\Redis::connection()->ping();
        return response()->json(['redis' => 'ok', 'ping' => $pong, 'config' => $info]);
    } catch (\Throwable $e) {
        return response()->json([
            'redis' => 'FAIL',
            'error_class' => get_class($e),
            'error' => $e->getMessage(),
            'config' => $info,
        ], 500);
    }
});

// Rotte pubbliche (non richiedono autenticazione)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Rotte protette (richiedono token Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // Workspaces
    Route::get('workspaces',                                        [WorkspaceController::class, 'index']);
    Route::post('workspaces',                                       [WorkspaceController::class, 'store']);
    Route::get('workspaces/{workspace}',                            [WorkspaceController::class, 'show']);
    Route::get('workspaces/{workspace}/stats',                      [WorkspaceController::class, 'stats']);
    Route::post('workspaces/{workspace}/members',                   [WorkspaceController::class, 'addMember']);
    Route::delete('workspaces/{workspace}/members/{userId}',        [WorkspaceController::class, 'removeMember']);

    // Meetings
    Route::get('workspaces/{workspace}/meetings',  [MeetingController::class, 'index']);
    Route::post('workspaces/{workspace}/meetings', [MeetingController::class, 'store']);
    Route::get('meetings/{meeting}',               [MeetingController::class, 'show']);
    Route::post('meetings/{meeting}/retry',        [MeetingController::class, 'retry']);

    // Tasks
    Route::patch('tasks/{task}',  [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
});
