# Colyseus Schema v4 — TypeScript Setup

## When to use
Setting up Colyseus Schema classes with `@type` decorators in a TypeScript project.

## Pattern

### tsconfig.json requirement
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```
Colyseus Schema v4 uses legacy-style property decorators. Without `experimentalDecorators`, TypeScript 5.x will try TC39 Stage 3 decorators and fail.

### Basic Schema class
```typescript
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") playerId: string = "";
  @type("number") credits: number = 0;
  @type("boolean") isOnline: boolean = false;
  @type("uint8") level: number = 0;  // use uint8/int16/etc for compact encoding
}
```

### Nested schemas
```typescript
export class SectorSchema extends Schema {
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>();
}

export class GalaxyState extends Schema {
  @type({ map: SectorSchema }) sectors = new MapSchema<SectorSchema>();
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
}
```

### Primitive types available
`"string"`, `"number"`, `"boolean"`, `"int8"`, `"uint8"`, `"int16"`, `"uint16"`, `"int32"`, `"uint32"`, `"int64"`, `"uint64"`, `"float32"`, `"float64"`

### Key constraints
- All fields need default values
- Schema classes must extend `Schema`
- Collection types: `ArraySchema<T>`, `MapSchema<T>`, `CollectionSchema<T>`, `SetSchema<T>`
- Enum values should be serialized as strings or numbers, not as Schema types

## Package
`@colyseus/schema@^4.0.19` — install in the workspace that defines schemas.
