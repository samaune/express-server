import debug from 'debug';
import exitHook from 'exit-hook';
import mssql from 'mssql';
const debugSQL = debug('mssql-multi-pool:index');
const POOLS = new Map();
function getPoolKey(config) {
    return `${config.user ?? ''}@${config.server}/${config.options?.instanceName ?? ''};${config.database ?? ''}`;
}
let shutdownInitialized = false;
export async function connect(config) {
    if (!shutdownInitialized) {
        debugSQL('Initializing shutdown hooks.');
        exitHook(() => {
            void releaseAll();
        });
        shutdownInitialized = true;
    }
    const poolKey = getPoolKey(config);
    let pool = POOLS.get(poolKey);
    if (pool === undefined || !pool.connected) {
        debugSQL(`New database connection: ${poolKey}`);
        console.log(`Database connection instance: ${poolKey}`);
        pool = await new mssql.ConnectionPool(config).connect();
        POOLS.set(poolKey, pool);
    }
    return pool;
}
export async function releaseAll() {
    debugSQL(`Releasing ${POOLS.size.toString()} pools.`);
    for (const poolKey of POOLS.keys()) {
        debugSQL(`Releasing pool: ${poolKey}`);
        try {
            const pool = POOLS.get(poolKey);
            if (pool !== undefined) {
                await pool.close();
            }
        }
        catch {
            debugSQL('Error closing connections.');
        }
    }
    POOLS.clear();
}
export function getPoolCount() {
    return POOLS.size;
}
export default {
    connect,
    releaseAll,
    getPoolCount
};