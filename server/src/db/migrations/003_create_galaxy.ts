import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("sectors", {
    id: { type: "integer", primaryKey: true },
    x: { type: "real", notNull: true, default: 0 },
    y: { type: "real", notNull: true, default: 0 },
  });

  pgm.createTable("warps", {
    sector_from_id: {
      type: "integer",
      notNull: true,
      references: "sectors",
      onDelete: "CASCADE",
    },
    sector_to_id: {
      type: "integer",
      notNull: true,
      references: "sectors",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("warps", "warps_pkey", {
    primaryKey: ["sector_from_id", "sector_to_id"],
  });
  pgm.createIndex("warps", "sector_from_id");
  pgm.createIndex("warps", "sector_to_id");

  pgm.createTable("ports", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    sector_id: {
      type: "integer",
      notNull: true,
      unique: true,
      references: "sectors",
      onDelete: "CASCADE",
    },
    name: { type: "varchar(128)", notNull: true },
    port_class: { type: "varchar(8)", notNull: true },
    last_restock: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("ports", "sector_id");

  pgm.createTable("port_commodities", {
    id: { type: "serial", primaryKey: true },
    port_id: {
      type: "uuid",
      notNull: true,
      references: "ports",
      onDelete: "CASCADE",
    },
    commodity: { type: "varchar(32)", notNull: true },
    stock: { type: "integer", notNull: true, default: 0 },
    max_stock: { type: "integer", notNull: true, default: 5000 },
    buy_price: { type: "integer", notNull: true, default: 0 },
    sell_price: { type: "integer", notNull: true, default: 0 },
    port_buys: { type: "boolean", notNull: true, default: false },
  });

  pgm.createIndex("port_commodities", "port_id");
  pgm.addConstraint(
    "port_commodities",
    "port_commodities_port_commodity_unique",
    { unique: ["port_id", "commodity"] },
  );

  // Add FK from players.current_sector_id → sectors.id now that sectors exist
  pgm.addConstraint("players", "players_current_sector_fk", {
    foreignKeys: {
      columns: "current_sector_id",
      references: "sectors",
    },
  });
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropConstraint("players", "players_current_sector_fk");
  pgm.dropTable("port_commodities");
  pgm.dropTable("ports");
  pgm.dropTable("warps");
  pgm.dropTable("sectors");
}
