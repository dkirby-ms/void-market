# Void Market — Core Game Systems Design

**Author:** Pemulis (Systems Dev)  
**Date:** 2026-03-16  
**Status:** Initial Design  

---

## Executive Summary

Void Market is a modern multiplayer space strategy game inspired by the BBS classic TradeWars 2002, built on Colyseus real-time multiplayer framework with PixiJS frontend. This document defines the three core systems that will make or break player engagement: **Turn Economy**, **Trading & Resource Economy**, and **Alliance/Federation System**.

The design balances the nostalgic turn-limited gameplay of TradeWars with modern real-time expectations, aiming for a game that rewards strategic planning over grinding, encourages emergent social dynamics through alliances, and creates a living economy driven by player choices.

---

## 1. Turn System Design

### Overview

The turn system is the heartbeat of Void Market. It constrains player actions to prevent 24/7 grinding while maintaining strategic depth. Players receive a daily allocation of turns that fuel nearly all meaningful actions.

### Research Context

**TradeWars 2002 Model:**
- Daily turn allocation (750-2000 turns typical)
- Every action costs turns: moving sectors (1 turn), trading at ports, attacking, deploying defenses
- Unused turns could bank up to a cap
- Daily "extern" reset replenished turns
- Turn efficiency was the core strategic metric

**Modern Games:**
- **Neptune's Pride**: Real-time with no strict action limits, but actions take real hours/days to complete
- **OGame**: Persistent real-time with queued actions; fleet movement limited by time, not discrete actions
- **Modern mobile/strategy**: Energy systems with gradual regeneration (e.g., 1 energy per 10 minutes)

### Void Market Turn Design

#### Turn Allocation

**Base System:**
- Each player receives **1000 turns per day** (base allocation)
- Turns regenerate gradually: **1 turn every 90 seconds** (40 per hour)
- Maximum bank: **2000 turns** (prevents infinite hoarding)
- New players start with **500 turns** (prevents immediate full-throttle advantage)

**Bonus Turn Sources:**
- Alliance bonuses: +5% turn generation for active alliance members
- Achievement unlocks: +100-200 turn cap increases
- Special events: 2x turn days, bonus turn packages as rewards
- Tech tree: "Efficient Logistics" research → +10% turn regen rate

#### Turn Costs by Action Type

**Free Actions (0 turns):**
- Viewing galaxy map, zooming, panning
- Reading messages, alliance chat, diplomacy screens
- Checking ship status, inventory, tech tree
- Market price checking (but not trading)
- Sending alliance invites, managing alliance settings
- Viewing player profiles, rankings, histories

**Low-Cost Movement (1-3 turns):**
- Move 1 sector: **1 turn**
- Warp gate jump: **2 turns** (but covers 5+ sectors)
- Emergency warp (escape): **5 turns** (cooldown: 1 hour)

**Economic Actions (2-10 turns):**
- Dock at port: **1 turn**
- Trade commodities (per transaction): **2 turns**
- Mine asteroid: **5 turns** (yields resources)
- Deploy trading beacon: **3 turns**
- Salvage wreckage: **4 turns**

**Combat Actions (10-20 turns):**
- Attack player ship: **15 turns**
- Attack planet: **20 turns**
- Deploy mines: **10 turns per minefield**
- Launch fighters: **8 turns per squadron**
- Rob port (piracy): **25 turns** (high risk/reward)

**Building & Development (15-50 turns):**
- Colonize planet: **50 turns** (major commitment)
- Build planetary improvements: **15-30 turns** (per structure)
- Construct space station: **100 turns** (alliance project, turns pooled)
- Deploy defense grid: **25 turns**

#### Turn Economy Balancing

**Preventing Degenerate Strategies:**

1. **No turn dumping:** Combat actions have diminishing returns. Attacking the same target repeatedly in one session costs +5 turns per successive attack (resets after 30 minutes).

2. **Cool-down mechanics:** High-value actions (planet colonization, major attacks) have cooldowns independent of turn cost, preventing instant-win scenarios even with banked turns.

3. **Opportunity costs:** Trading vs. combat vs. exploration create meaningful choices. A player spending 500 turns on trading can't simultaneously wage war.

4. **Alliance turn pools:** Major alliance projects (space stations, citadels) use pooled turns from multiple members, requiring coordination.

**Turn Cost Philosophy:**

- **Exploration:** Cheap (1-3 turns) — encourages map knowledge
- **Trading:** Moderate (2-10 turns) — sustainable daily income activity
- **Combat:** Expensive (15-25 turns) — deliberate, strategic commitment
- **Empire Building:** Very expensive (50+ turns) — long-term investment

#### Integration with Colyseus Real-Time Architecture

**Hybrid Turn/Real-Time Model:**

Void Market uses a **persistent state, discrete action** model:

1. **Server State:**
   ```typescript
   class PlayerState extends Schema {
     @type("number") currentTurns: number = 500;
     @type("number") maxTurns: number = 2000;
     @type("number") lastTurnRegen: number = Date.now();
     @type("number") turnRegenRate: number = 90; // seconds per turn
   }
   ```

2. **Turn Regeneration:**
   - Server ticks every 5 seconds (using Colyseus clock)
   - Calculates elapsed time since last regen
   - Awards turns: `turnsToAdd = floor(elapsedSeconds / turnRegenRate)`
   - Caps at `maxTurns`

3. **Action Validation:**
   - Client sends `{ action: "move", targetSector: 42 }`
   - Server checks: `if (player.currentTurns >= ACTION_COSTS.move)`
   - Deducts turns, updates game state
   - Broadcasts delta to all clients via Colyseus Schema sync

4. **Real-Time Feedback:**
   - Clients display turn count updating in real-time (every 90 seconds)
   - Visual indicators for "turns regenerating" vs "out of turns"
   - Action buttons show turn costs and grey out when unaffordable

**Advantages:**
- Players can check in any time (no strict turns per day reset)
- Gradual regeneration prevents "use it or lose it" daily deadline stress
- Banking allows casual players to accumulate for weekend play sessions
- Server-authoritative prevents turn exploits

**Trade-offs:**
- Slightly less nostalgic than strict daily reset
- Requires careful balancing to prevent always-online advantage (mitigated by 2000 turn cap)

---

## 2. Economy & Trading System

### Overview

The economy creates the persistent strategic landscape. Resource scarcity, trade routes, and market dynamics drive daily gameplay. Unlike most space games where combat is primary, trading is a viable path to dominance.

### Research Context

**TradeWars 2002 Model:**
- Three commodities: Fuel Ore, Organics, Equipment
- Ports classified as Buyers (B) or Sellers (S) for each commodity (e.g., SBB, BSB, BBS)
- **Port pair trading:** Find adjacent SBB-BBS ports for minimal-turn arbitrage
- Dynamic pricing: Repeated trades depleted stock, worsened prices until daily reset
- **Haggling system:** Negotiate prices with risk/reward
- Mega-robbing: Pirate-aligned players rob ports for huge gains but turn hostile

**Modern Strategy Games:**
- **EVE Online:** Complex production chains, player-driven markets, regional pricing
- **OGame:** Mine-refine-build pipeline, raid-based resource acquisition
- Most modern games use multi-tier resources (raw → refined → components → products)

### Void Market Economy Design

#### Resource Types

**Primary Commodities (TradeWars heritage):**

1. **Fuel Ore** — Movement, defense, ship operations
   - Sources: Asteroid mining, ore-rich planets, seller ports
   - Sinks: Ship movement, weapons fire, base maintenance
   - Volatility: Low (always needed)

2. **Organics** — Population, ship crew, life support
   - Sources: Agricultural planets, biological nebulae, seller ports
   - Sinks: Colony growth, crew wages, bio-tech research
   - Volatility: Medium (spikes during colonization waves)

3. **Equipment** — Construction, weapons, ship upgrades
   - Sources: Industrial planets, equipment ports, salvage
   - Sinks: Ship construction, base building, tech upgrades
   - Volatility: High (war = huge demand)

**Secondary Resources (Depth):**

4. **Credits** — Universal currency
   - Sources: Trade profits, mission rewards, combat bounties, taxes
   - Sinks: Port trades, ship purchases, planet development, bribes

5. **Exotic Matter** — Advanced tech, rare upgrades (late-game)
   - Sources: Deep space exploration, rare anomalies, high-level salvage
   - Sinks: Superweapons, warp gate construction, experimental tech

6. **Reputation** — Invisible resource affecting NPC interactions
   - Sources: Successful trades, mission completion, alliance contributions
   - Sinks: Piracy, betrayals, port robberies

#### Port & Market System

**NPC Ports (70% of trade):**

- **Port Classes:** Each port specializes in 1-2 commodities
  - **Ore Seller (S-B-B):** Sells Fuel Ore cheap, buys Organics/Equipment high
  - **Org Seller (B-S-B):** Sells Organics cheap, buys Ore/Equipment high
  - **Equipment Seller (B-B-S):** Sells Equipment cheap, buys Ore/Organics high
  - **Megaports (S-S-S):** Sell all three, but at poor prices (convenience)
  - **Trading Posts (B-B-B):** Buy all three, moderate prices (safe sell)

- **Port Locations:** Fixed positions, published on map (no hidden ports)

- **Dynamic Pricing Engine:**
  ```typescript
  basePrice = PORT_BASE_PRICES[commodity];
  stockLevel = port.currentStock / port.maxStock; // 0-1
  demandMultiplier = 1 + (1 - stockLevel) * 0.5; // 1.0 to 1.5x
  playerTradeImpact = (amountTraded / port.maxStock) * 0.2; // up to 20% shift
  finalPrice = basePrice * demandMultiplier;
  ```

- **Stock Replenishment:** Ports restock 10% per hour, full reset daily (midnight UTC)

- **Haggling:** Players can attempt to improve prices (±5-10%)
  - Success chance: `baseChance(30%) + (playerReputation * 2%) - (attemptPenalty * 5%)`
  - Failed haggle → price worsens slightly, reputation hit
  - Critical success (5% chance) → double haggle bonus

**Player Markets (30% of trade):**

- **Planetary Markets:** Alliance-controlled planets can establish markets
  - Set buy/sell prices for commodities
  - Compete with NPC ports
  - Profits fund alliance treasury

- **Direct Trade:** Players can trade directly (escrow system prevents scams)

- **Contracts:** Post buy/sell orders, delivery contracts
  - Example: "Buy 10,000 Organics, deliver to Sector 42, pay 50,000cr"

#### Price Dynamics & Arbitrage

**Regional Pricing:**

Galaxy divided into **5 regions** (Core, Frontier, Outer Rim, Deep Space, Contested):

- **Core:** Stable prices, low margins (safe but slow profit)
- **Frontier:** Moderate volatility, good arbitrage opportunities
- **Outer Rim:** High volatility, excellent margins, pirate risk
- **Deep Space:** Exotic Matter available, extreme risk/reward
- **Contested:** Alliance war zones, supply shortages create price spikes

**Trade Route Strategy:**

- **Classic Port Pair:** Find adjacent S-B ports (ore seller + ore buyer)
  - Example: Sector 10 (S-B-B) → Sector 11 (B-S-B)
  - Buy ore cheap at 10, sell high at 11 (1 turn travel = 2 turn round trip + 4 turns trading = 6 turns)
  - Profit: ~500-1000cr per trip, sustainable for 20-30 trips before depletion

- **Multi-leg Routes:** Chain trades for higher margins
  - Sector 10 (ore) → 20 (exchange ore for organics) → 30 (sell organics)
  - Higher turns, higher risk, much higher profit

- **Supply Runs:** Alliance contracts pay premiums for war zone deliveries
  - Example: Deliver 5,000 Equipment to besieged planet, earn 100,000cr + alliance rep

#### Economy Anti-Inflation Mechanics

**Resource Sinks:**

1. **Combat Losses:** Ships destroyed = equipment/fuel/organics lost permanently
2. **Maintenance Costs:** Planets/bases cost daily upkeep (scales with size)
3. **NPC Taxes:** 2% transaction tax on all port trades (credits vanish)
4. **Tech Research:** Expensive, one-time credit sinks (100k-1M credits)
5. **Alliance Projects:** Mega-structures require millions in resources

**Wealth Concentration Prevention:**

- **Diminishing Returns:** Repeated identical trades within 1 hour earn 10% less profit per iteration
- **Storage Limits:** Ship cargo limited (must upgrade, costs scale exponentially)
- **Planetary Caps:** Planets max out resource production (can't hoard infinitely)
- **Progressive Taxes:** Top 10% wealthiest players pay 5% daily "security tax"

**Economic Cycles:**

- **War Booms:** Combat increases equipment demand, prices spike, traders profit
- **Peace Slumps:** Excess supply, prices crash, mining/production slows
- **Exploration Waves:** New sectors discovered → resource rush → price normalization

---

## 3. Alliance/Federation System

### Overview

Alliances transform Void Market from a single-player grind into a social, political, emergent narrative game. Corporations (teams) compete for territory, resources, and dominance through diplomacy, war, and coordination.

### Research Context

**TradeWars 2002 Model:**
- Corporations: Up to 5 players, shared planets/resources
- Shared docking rights, collaborative defense
- Informal alliances between corps
- Famous corps (Boo! Inc) dominated through coordination
- Core social experience: planning, betrayal, coordination

**EVE Online Model:**
- Corporations → Alliances → Coalitions (three-tier hierarchy)
- Complex diplomacy: standings (red/blue), NAPs, coalitions
- Territorial sovereignty (only alliances can own null-sec)
- Dedicated diplomat roles (junior → ambassador)
- Extensive third-party management tools

### Void Market Alliance Design

#### Formation & Structure

**Alliance Creation:**

- **Requirements:**
  - Player must be level 10+ (prevents spam alliances)
  - Costs 100,000 credits (significant early investment)
  - Choose alliance name, tag (3-5 letters), description

- **Alliance Limits:**
  - Maximum 50 members per alliance (prevents mega-blob)
  - Maximum 5 alliances can form a Federation (see below)

**Ranks & Roles:**

1. **Founder (1 per alliance):**
   - Full control: kick members, promote/demote, disband
   - Set alliance tax rate (0-20% of member earnings)
   - Declare wars, propose treaties
   - Transfer founder status (7-day cooldown)

2. **Admiral (up to 3):**
   - Invite/kick members (except Founder)
   - Manage alliance territory claims
   - Set fleet doctrines (recommended ship loadouts)
   - Cannot disband or declare war alone

3. **Diplomat (up to 5):**
   - Negotiate with other alliances
   - Set alliance standings (see Diplomacy section)
   - View/manage treaty proposals
   - Access intelligence reports

4. **Officer (up to 10):**
   - Invite members (cannot kick)
   - Manage alliance markets
   - Post alliance missions/contracts
   - Basic territory management

5. **Member (unlimited):**
   - Access alliance chat, map markers
   - Dock at alliance planets
   - Contribute to alliance projects
   - Vote on alliance motions (if enabled)

#### Shared Resources & Territory

**Alliance Assets:**

- **Treasury:** % of member earnings (set by Founder, 0-20% tax)
  - Funds alliance projects, fleet ops, bounties
  - Transparent ledger (all members see income/expenses)

- **Planets:** Members can dedicate planets to alliance control
  - Alliance gains resource income
  - All members can dock/trade
  - Defenses paid from alliance treasury

- **Space Stations:** Alliance-constructed mega-projects
  - Cost: 500,000cr + 100,000 ore + 50,000 equipment + 2,000 pooled turns
  - Benefits: Safe spawn point, repair/refit facilities, market hub
  - Only 1 station per alliance (strategic location choice matters)

- **Tech Pool:** Researched tech shared among alliance members
  - Alliance-funded research unlocks for all members
  - Example: "Alliance Mining Efficiency II" → +15% ore yield for all members

**Territory Control:**

- **Sector Claims:** Alliances can claim up to 10 sectors
  - Cost: 50,000cr per sector + defensive structures
  - Grants: Tax on all trades in sector (5%), sensor coverage, spawn priority
  - Must be defended: Rivals can contest (triggers war mechanic)

- **Contested Zones:** Sectors claimed by multiple alliances = war automatically
  - Control determined by structure count + fleet presence + time
  - Weekly tick: Dominant alliance gains permanent control until contested again

#### Diplomacy Mechanics

**Alliance Standings (EVE-inspired):**

- **+10 (Blue, Allied):** Full trust
  - Shared map intel (see each other's exploration)
  - Can dock at each other's stations/planets
  - Cannot attack (requires standing change + 48hr cooldown)
  - Alliance chat bridge (optional)

- **+5 (Friendly):** Non-aggression pact
  - No shared intel
  - Can dock if permitted
  - Attacks incur reputation penalty

- **0 (Neutral):** Default state
  - Normal interactions
  - Attacks have no extra penalty

- **-5 (Unfriendly):** Hostile diplomacy
  - Cannot dock
  - Attacks encouraged
  - No trade deals

- **-10 (Red, At War):** Active warfare
  - All attacks rewarded (bounty bonuses)
  - Sector contests active
  - Alliance-wide war mode (see War System)

**Treaties & Agreements:**

- **Non-Aggression Pact (NAP):** Agree not to attack for 7 days minimum
  - Costs: 10,000cr each
  - Breaking early → -50 reputation, 48hr cooldown on new treaties

- **Trade Agreement:** Reduce transaction costs between alliances (2% → 0.5%)
  - Mutual benefit
  - Duration: 14 days

- **Defense Pact:** Mutual defense (if one is attacked, both at war with aggressor)
  - High-stakes commitment
  - Minimum 30 days
  - Triggers automatically on war declaration

- **Federation Formation (see next section)**

#### War System

**Declaring War:**

- **Requirements:**
  - Founder or Admiral can propose
  - 50% member vote (or Founder override)
  - Costs 100,000cr from alliance treasury
  - 24-hour declaration period (target is notified, can prepare)

- **War Duration:** Minimum 7 days, can extend until formal surrender/treaty

- **War Objectives:**
  - Capture contested sectors
  - Destroy enemy space station (war goal)
  - Force surrender through attrition (treasury depletion)

- **War Rewards:**
  - Victors gain contested territory
  - 50% of loser's alliance treasury
  - Reputation gains, title unlocks

**War Mechanics:**

- **Kill Boards:** Track alliance vs. alliance kills (public prestige)
- **Blockades:** Station/planet sieges cut off docking/trade
- **Sabotage Missions:** Covert ops reduce enemy resource production (10 turns, high skill)
- **Peace Treaties:** Either side can propose peace, requires negotiation or credits/territory

#### Federation System (Super-Alliances)

**Formation:**

- **Requirements:**
  - 2-5 alliances agree to form Federation
  - Each alliance Founder must approve
  - Costs 500,000cr per alliance (serious commitment)
  - Elects Federation Council (1 rep per alliance)

- **Federation Benefits:**
  - Shared territory claims (up to 50 sectors total)
  - Coordinated war declarations
  - Federation-wide diplomatic standings
  - Mega-projects (Mega-stations, sector fortresses)

- **Federation Governance:**
  - **Council Votes:** Major decisions require 51%+ alliance agreement
    - Declare federation-wide wars
    - Expel member alliance
    - Change federation tax (0-5%)
  - **Federation Tax:** Additional 0-5% from member alliances (controversial!)

- **Political Dynamics:**
  - Inner politics: Small alliances fear exploitation by large ones
  - Coalitions of federations (meta-gameplay)
  - Betrayals/coups: Alliance can leave federation (7-day cooldown, loses federation projects)

**Example Federation Structure:**

```
Federation: "Galactic Empire"
├── Alliance: Crimson Fleet (50 members) — Founder: Admiral_Thrawn
├── Alliance: Iron Corsairs (45 members) — Founder: Pirate_Queen
├── Alliance: Star Merchants (30 members) — Founder: Trade_Prince
└── Alliance: Void Sentinels (20 members) — Founder: Dark_Watcher

Total: 145 members
Claims: 32 sectors (Core + Frontier regions)
At War: Federation "Rebel Alliance" (3 alliances, 90 members)
```

#### Alliance Anti-Griefing & Fairness

**Preventing Exploitation:**

1. **Kick Cooldown:** Kicked members cannot be attacked by former alliance for 48 hours
2. **Theft Protection:** Members cannot withdraw from alliance treasury (only Founder + Admirals)
3. **Coup Prevention:** Founder transfer requires 7-day confirmation window (can be canceled)
4. **Minimum Duration:** Alliances cannot disband for 7 days after creation (prevents scam alliances)
5. **Reputation System:** Betraying allies → severe reputation loss → NPC ports refuse service

**Encouraging Healthy PvP:**

- **Opt-In PvP Zones:** Sectors classified as PvP, PvE, or Mixed
  - New players start in PvE zones (no player attacks)
  - Late-game rewards in PvP zones (Contested, Deep Space)
  - Alliance wars override zones (if at war, PvP everywhere)

- **Proportional Rewards:** Attacking weaker players yields reduced rewards (discourages bullying)
- **Bounty System:** Griefers get NPC bounties, hunted by all players

#### Social & Emergent Gameplay

**Why Alliances Will Be Compelling:**

1. **Shared Goals:** Alliance projects (stations, mega-structures) require team effort
2. **Social Defense:** Solo players vulnerable, alliance provides safety
3. **Economic Power:** Alliance markets + trade networks > solo trading
4. **Prestige:** Alliance rankings, kill boards, territory control = bragging rights
5. **Narrative:** Player-driven stories (betrayals, epic wars, underdog victories)

**Communication Tools:**

- **Alliance Chat:** Real-time text chat (Colyseus rooms)
- **Map Markers:** Shared intel (danger zones, trade routes, enemy fleets)
- **Alliance Mail:** Persistent messages, announcements
- **External Integration:** Discord webhooks for notifications (optional)

---

## Integration & Implementation Notes

### Colyseus Architecture

**State Management:**

```typescript
class GalaxyWarsState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Alliance }) alliances = new MapSchema<Alliance>();
  @type({ map: Sector }) sectors = new MapSchema<Sector>();
  @type({ map: Port }) ports = new MapSchema<Port>();
  @type([Treaty]) activeTreaties = new ArraySchema<Treaty>();
}

class Player extends Schema {
  @type("string") id: string;
  @type("number") currentTurns: number;
  @type("number") maxTurns: number;
  @type("number") credits: number;
  @type("string") allianceId: string | null;
  @type("number") reputation: number;
  // ... ship, inventory, location, etc.
}

class Alliance extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("string") founderPlayerId: string;
  @type([AllianceMember]) members = new ArraySchema<AllianceMember>();
  @type("number") treasury: number;
  @type({ map: "number" }) standings = new MapSchema<number>(); // allianceId -> standing
  @type([string]) claimedSectors = new ArraySchema<string>();
  // ... more fields
}
```

**Server Ticks:**

- **Fast Tick (1 second):** Ship movement, combat resolution, player turn regen
- **Slow Tick (60 seconds):** Port restocking, alliance territory scoring, market price updates
- **Daily Reset (midnight UTC):** Full port restock, turn cap bonuses, alliance reports

**Message Handling:**

```typescript
room.onMessage("action", (client, data) => {
  const player = this.state.players.get(client.sessionId);
  
  // Validate turn cost
  const turnCost = ACTION_COSTS[data.actionType];
  if (player.currentTurns < turnCost) {
    client.send("error", "Insufficient turns");
    return;
  }
  
  // Execute action
  handleAction(player, data);
  player.currentTurns -= turnCost;
  
  // Broadcast state changes (automatic via Colyseus Schema)
});
```

### Data Modeling

**PostgreSQL Tables:**

```sql
-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  alliance_id UUID REFERENCES alliances(id),
  current_turns INT DEFAULT 500,
  max_turns INT DEFAULT 2000,
  credits BIGINT DEFAULT 10000,
  reputation INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alliances
CREATE TABLE alliances (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  tag VARCHAR(5) UNIQUE NOT NULL,
  founder_id UUID REFERENCES players(id),
  treasury BIGINT DEFAULT 0,
  tax_rate DECIMAL(3,2) DEFAULT 0.05,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alliance Members (with roles)
CREATE TABLE alliance_members (
  alliance_id UUID REFERENCES alliances(id),
  player_id UUID REFERENCES players(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (alliance_id, player_id)
);

-- Alliance Standings
CREATE TABLE alliance_standings (
  alliance_id UUID REFERENCES alliances(id),
  target_alliance_id UUID REFERENCES alliances(id),
  standing INT DEFAULT 0, -- -10 to +10
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (alliance_id, target_alliance_id)
);

-- Treaties
CREATE TABLE treaties (
  id UUID PRIMARY KEY,
  alliance_a_id UUID REFERENCES alliances(id),
  alliance_b_id UUID REFERENCES alliances(id),
  treaty_type VARCHAR(30), -- 'nap', 'trade', 'defense', 'federation'
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

-- Sectors (procedurally generated, stored for persistence)
CREATE TABLE sectors (
  id INT PRIMARY KEY,
  region VARCHAR(30),
  owner_alliance_id UUID REFERENCES alliances(id),
  port_id UUID,
  coordinates JSONB -- {x, y, z}
);

-- Ports
CREATE TABLE ports (
  id UUID PRIMARY KEY,
  sector_id INT REFERENCES sectors(id),
  port_class VARCHAR(10), -- 'SBB', 'BSB', etc.
  ore_stock INT,
  organics_stock INT,
  equipment_stock INT,
  last_restock TIMESTAMP DEFAULT NOW()
);

-- Trade History (for price dynamics)
CREATE TABLE trade_history (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  port_id UUID REFERENCES ports(id),
  commodity VARCHAR(20),
  amount INT,
  price_per_unit INT,
  trade_type VARCHAR(10), -- 'buy' or 'sell'
  traded_at TIMESTAMP DEFAULT NOW()
);
```

### Client-Side (PixiJS)

**UI Elements:**

- **Turn Counter:** Persistent HUD element, updates every second
  - Shows: `1,234 / 2,000 turns` + regen timer `Next turn in 45s`
  - Turns green when full, yellow when <500, red when <100

- **Galaxy Map:** PixiJS rendering of sector graph
  - Color-coded: Blue = alliance controlled, Red = enemy, Yellow = contested, Grey = neutral
  - Hover tooltips: Port types, owner, resources

- **Alliance Panel:** Tabbed interface
  - Members tab: Online status, turn contributions, ranks
  - Treasury tab: Income/expense ledger, recent transactions
  - Diplomacy tab: Standings, treaties, war status
  - Territory tab: Claimed sectors, defense status

- **Trade Interface:** Port docking screen
  - Live price updates (Colyseus state sync)
  - Slider for amount, turn cost displayed prominently
  - Haggle button (mini-game: press when bar is green)

---

## Balancing & Tuning Levers

### Turn Economy Tuning

| Parameter | Initial Value | Rationale |
|-----------|---------------|-----------|
| Base daily allocation | 1000 turns | Balances engagement (1-2 hours play) with casual accessibility |
| Regen rate | 1 turn/90sec | ~40/hour, 960/day (close to base allocation) |
| Max bank | 2000 turns | Weekend warriors can save Friday/Saturday, but not infinite |
| Move cost | 1 turn | Exploration should be cheap |
| Trade cost | 2 turns | Core gameplay loop, moderate cost |
| Combat cost | 15-25 turns | Expensive = deliberate warfare |
| Building cost | 50+ turns | Major commitment |

**Tuning Indicators:**
- If players run out of turns daily: Increase regen rate or decrease action costs
- If players always at max bank: Decrease max bank or increase high-value action appeal
- If combat too rare: Decrease combat costs or increase combat rewards
- If trading too dominant: Increase trade costs or decrease margins

### Economy Tuning

| Parameter | Initial Value | Rationale |
|-----------|---------------|-----------|
| Starting credits | 10,000 | Enough for 1 trade loop + emergencies |
| Port pair profit | 500-1000cr/trip | Sustainable income, not get-rich-quick |
| Ship cargo base | 1,000 units | Limits scaling, forces trade-offs |
| NPC transaction tax | 2% | Steady credit sink |
| Maintenance costs | 100-10,000cr/day | Scales with empire size |

**Tuning Indicators:**
- If inflation: Increase taxes, maintenance costs, add new sinks
- If deflation: Increase rewards, decrease costs
- If no one trades: Increase margins, decrease costs
- If trading too lucrative: Add competition (NPC traders), decrease margins

### Alliance Tuning

| Parameter | Initial Value | Rationale |
|-----------|---------------|-----------|
| Max alliance size | 50 members | Large enough for community, small enough to prevent mega-blobs |
| Alliance creation cost | 100,000cr | Significant but achievable (1 week trading) |
| Station cost | 500,000cr + resources | Massive alliance goal (requires 10-20 members contributing) |
| War declaration cost | 100,000cr | Prevents frivolous wars |
| Minimum war duration | 7 days | Allows meaningful conflict, not instant surrender |

**Tuning Indicators:**
- If too many solo players: Increase alliance benefits, decrease costs
- If mega-alliances dominate: Decrease max size, add alliance tiers with diminishing returns
- If no wars: Decrease declaration cost, increase rewards
- If constant griefing wars: Increase costs, add reputation penalties

---

## Success Metrics

### Core KPIs

1. **Daily Active Users (DAU) / Monthly Active Users (MAU):**
   - Target: 40%+ DAU/MAU ratio (high engagement)
   - Indicates turn system creates daily habit loop

2. **Session Duration:**
   - Target: 30-60 minutes average
   - Too low = not engaging, too high = grindy

3. **Turn Utilization Rate:**
   - % of daily turns used by active players
   - Target: 60-80% (players engaged but not desperate)

4. **Alliance Membership Rate:**
   - % of active players in alliances
   - Target: 70%+ (social gameplay succeeds)

5. **Trade Volume:**
   - Total daily credits traded
   - Healthy economy indicator

6. **War Frequency:**
   - Active wars per week
   - Target: 2-5 major wars (meaningful conflict without chaos)

7. **Player Retention:**
   - Day 1: 50%, Day 7: 30%, Day 30: 15%
   - Comparable to successful strategy games

### Behavioral Signals

**Positive:**
- Players logging in at turn regen intervals (system works)
- Active alliance Discord communities forming
- Player-created trade route guides, strategy wikis
- "Epic war" stories shared on social media
- Alliance diplomacy negotiations in chat

**Negative:**
- Players consistently capping turns (too slow regen)
- Players never capping turns (too fast regen or not engaging)
- No alliance membership (social failure)
- Instant wars with no diplomacy (system too simple)
- Wealth concentration in top 1% (economy broken)

---

## Risks & Mitigation

### Risk: Turn System Feels Restrictive

**Symptoms:** Players complain about "running out of turns," quit when out of turns

**Mitigation:**
- Gradual regen (never truly "out" for long)
- Free social actions (chat, planning, map viewing)
- Alliance coordination (pool turns for projects)
- Clear communication: "Turns replenish in 45 minutes"

### Risk: Economy Runaway Inflation

**Symptoms:** Late-game players have billions, new players can't compete

**Mitigation:**
- Progressive taxes on wealthy players
- Escalating maintenance costs (empire size penalty)
- Credit sinks (mega-projects, rare items)
- Combat losses (permanent resource destruction)
- Reset servers seasonally (6-12 month seasons)

### Risk: Alliance Mega-Blobs Dominate

**Symptoms:** One alliance controls 80%+ of map, no one can compete

**Mitigation:**
- Hard cap: 50 members per alliance
- Diminishing returns on alliance size (larger = more expensive)
- Territory claim limits (10 sectors max)
- Underdog bonuses (smaller alliances get combat buffs vs. larger)
- Federation complexity (multi-alliance coordination is hard)

### Risk: Griefing & Toxicity

**Symptoms:** High-level players camp newbie zones, constant harassment

**Mitigation:**
- PvE newbie zones (safe for levels 1-10)
- Proportional rewards (attacking weaker players = bad rewards)
- Reputation system (griefers become NPC targets)
- Alliance protection (strength in numbers)
- Kick cooldowns (48hr protection after alliance kick)
- Moderation tools (report, mute, ban)

### Risk: Too Complex for New Players

**Symptoms:** High early churn, "too complicated" feedback

**Mitigation:**
- Progressive tutorial (spread over first 10 levels)
- Guided first trade route mission
- Alliance recruitment drives (veterans help newbies)
- Simplified UI for new players (hide advanced features until level 5)
- NPC helper bot (answers basic questions)

---

## Future Expansion Opportunities

### Phase 2 Features (Post-Launch)

1. **Seasonal Leaderboards & Resets:**
   - 6-month seasons with fresh starts
   - Leaderboard rewards (cosmetics, titles)
   - Persistent legacy benefits for veterans

2. **Advanced Diplomacy:**
   - Trade embargoes (alliance-wide blockades)
   - Espionage missions (spy on enemy alliance)
   - Propaganda (influence neutral players)

3. **Player-Owned Stations:**
   - Solo players can build small stations
   - Monetize through docking fees, markets

4. **Dynamic Events:**
   - Alien invasions (PvE cooperation)
   - Resource rushes (new sector discovered)
   - Economic crises (port strikes, trade route blockages)

5. **Mobile Companion App:**
   - Check turn count, send messages
   - Execute simple trades on mobile
   - Alliance notifications

### Phase 3+ (Long-Term Vision)

- **Custom Sectors:** Player-designed sectors (mods, custom ports)
- **Mega-Corporations:** PvE AI factions that react to player actions
- **Territorial Warfare:** Real-time RTS battles for sector control
- **Galactic Senate:** Cross-alliance governance (late-game political layer)

---

## Conclusion

Void Market combines the strategic depth and social dynamics of TradeWars 2002 with modern real-time multiplayer infrastructure. The three core systems—**Turn Economy**, **Trading & Resource Management**, and **Alliance/Federation Structure**—work together to create a persistent, emergent, player-driven experience.

**Turn economy** constrains player actions to prevent grinding, ensuring strategy > time investment.

**Economy & trading** creates a living world where players can thrive through commerce, piracy, or warfare, with dynamic pricing and meaningful resource scarcity.

**Alliances & diplomacy** transform the game from single-player optimization into a social, political, narrative-driven experience where betrayals, epic wars, and underdog victories create lasting memories.

By balancing nostalgia for TradeWars with modern multiplayer best practices (Colyseus real-time state sync, progressive turn regeneration, anti-griefing safeguards), Void Market can capture both veteran BBS gamers and a new generation of strategy players.

**Next Steps:**
1. Prototype turn regeneration system in Colyseus
2. Build basic port trading with dynamic pricing
3. Implement alliance creation + standing system
4. Playtest with 20-50 users, gather feedback
5. Iterate and balance

---

**End of Document**
