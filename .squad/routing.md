# Squad Routing — Galaxy Wars

## Domain Routing

| Domain | Primary | Secondary | Keywords |
|--------|---------|-----------|----------|
| Game rendering, sprites, animations, PixiJS | Gately | Mario | pixi, render, sprite, animation, canvas, visual |
| UI components, HUD, menus, player interface | Gately | Mario | ui, hud, menu, panel, button, interface |
| Colyseus server, rooms, state sync | Pemulis | Hal | colyseus, server, room, sync, multiplayer, netcode |
| Game economy, trading, resources, mining | Pemulis | Hal | economy, trade, resource, mining, market, currency |
| Turn system, action points, daily limits | Pemulis | Hal | turn, action, limit, daily, throttle |
| Alliance/federation system | Pemulis | Gately | alliance, federation, guild, team, diplomacy |
| Ship combat, fleets, military | Gately | Pemulis | combat, fleet, ship, attack, defend, battle, weapon |
| Galaxy map, sectors, navigation | Gately | Pemulis | galaxy, map, sector, warp, navigate, explore |
| Planet settlement, outposts, stations | Pemulis | Gately | planet, outpost, station, colony, settle, build |
| Architecture, system design, scope | Hal | — | architecture, design, scope, structure, plan |
| Testing, QA, balance | Steeply | — | test, qa, quality, balance, edge case, bug |
| CI/CD, deployment, infra | Marathe | — | ci, cd, deploy, pipeline, docker, infra |
| Docs, README, guides, community | Joelle | — | doc, readme, guide, community, onboard |
| UX, player experience, interface design | Mario | Gately | ux, experience, flow, usability, accessibility |

## Escalation

- Scope/architecture disputes → Hal (final call)
- Cross-domain work → Hal coordinates, spawns relevant agents
- "Team" requests → fan-out to all relevant domains
