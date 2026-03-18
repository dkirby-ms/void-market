import { VERSION, Commodity, TURN_COSTS, ActionType, GalaxyState } from "@void-market/shared";

console.log(`@void-market/server v${VERSION}`);
console.log(`Commodities: ${Object.values(Commodity).join(", ")}`);
console.log(`Move cost: ${TURN_COSTS[ActionType.Move]} turn(s)`);
console.log(`GalaxyState schema: ${GalaxyState.name}`);
