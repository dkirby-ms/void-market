import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("players", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    display_name: { type: "varchar(64)", notNull: true },
    credits: { type: "numeric(15,2)", notNull: true, default: 10000 },
    turns_remaining: { type: "integer", notNull: true, default: 500 },
    turns_max: { type: "integer", notNull: true, default: 2000 },
    current_sector_id: { type: "integer", notNull: true, default: 1 },
    is_docked: { type: "boolean", notNull: true, default: false },
    is_online: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("players", "user_id");
  pgm.createIndex("players", "current_sector_id");

  pgm.createTable("ships", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    player_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "players",
      onDelete: "CASCADE",
    },
    ship_class: { type: "varchar(32)", notNull: true, default: "'scout'" },
    name: { type: "varchar(64)", notNull: true, default: "'Starter Ship'" },
    cargo_holds: { type: "integer", notNull: true, default: 0 },
    max_cargo_holds: { type: "integer", notNull: true, default: 25 },
    speed: { type: "integer", notNull: true, default: 3 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("ships", "player_id");

  pgm.createTable("cargo", {
    id: { type: "serial", primaryKey: true },
    ship_id: {
      type: "uuid",
      notNull: true,
      references: "ships",
      onDelete: "CASCADE",
    },
    commodity: { type: "varchar(32)", notNull: true },
    quantity: { type: "integer", notNull: true, default: 0 },
  });

  pgm.createIndex("cargo", "ship_id");
  pgm.addConstraint("cargo", "cargo_ship_commodity_unique", {
    unique: ["ship_id", "commodity"],
  });
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable("cargo");
  pgm.dropTable("ships");
  pgm.dropTable("players");
}
