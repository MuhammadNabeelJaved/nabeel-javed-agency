/**
 * Data Update Service
 *
 * Emits `data:updated` to a list of authenticated socket rooms so that
 * connected clients automatically refresh their data without a page reload.
 *
 * On the client, SocketContext listens for `data:updated` and dispatches
 * a window `cms:updated` CustomEvent — this triggers all useDataRealtime
 * hooks that watch the given section.
 *
 * Known rooms:
 *  - "admin:global"   → all admin users
 *  - "team:global"    → all team members
 *  - "user:{userId}"  → a specific user's private room
 *
 * Usage:
 *   emitDataUpdate(io, 'projects', ['admin:global', `user:${userId}`]);
 */

/**
 * @param {import('socket.io').Server} io
 * @param {string} section  — matches the section string used in useDataRealtime()
 * @param {string[]} rooms  — array of Socket.IO room names to emit to
 */
export function emitDataUpdate(io, section, rooms = []) {
    if (!io || !rooms.length) return;
    for (const room of rooms) {
        io.to(room).emit("data:updated", { section });
    }
}
