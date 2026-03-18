/**
 * Database barrel export.
 * Re-exports the connection pool, query helper, and teardown utility.
 */
export { pool, query, closePool } from "./connection.js";
export {
  savePlayer,
  loadPlayer,
  saveAllPlayers,
  type PlayerData,
} from "./PlayerRepository.js";
export {
  galaxyExists,
  saveGalaxy,
  loadGalaxy,
  savePortCommodities,
} from "./GalaxyRepository.js";
