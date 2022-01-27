# foundryvtt-ose-lights

## Light source module for OSE

This Foundry VTT module automates the illumination of light sources for a character, and the tracking of the usage of required resources in character inventories.

I wrote this as a module just for personal use that was very specifically designed for use with the fabulous [OSE](https://foundryvtt.com/packages/ose) system in Foundry VTT, and more specifically, the items in the [OGL Content](https://gitlab.com/mesfoliesludiques/foundryvtt-ose-content) that appears no longer to be maintained.

I offer it as-is.

## Usage

The aim of this is to be as automatic and simple as possible, using the existing content and time management modules to track and simulate light resource use. It achieves this with macros, that can be used either by the GM or the players (based on chosen **Settings**).

### Settings

Simply enable player usage, or restrict it to only GM usage.

### Macros

The module comes with a very simple macro - Clock - to bring up with [Simple Calendar UI](https://foundryvtt.com/packages/foundryvtt-simple-calendar) to control time.

The module comes with 3 macros - Torch, Lantern and Light Spell. If you enable Player usage, you should share their visibility with your players so they can trigger them themselves.

Clicking on one of the macros, whilst having a token selected, will then do the following:

- check if the token already has a light source on
- if it does, it will extinguish that light source
- if it doesn't, it will then check if the token has the necessary resources in their inventory to use that kind of light source,
- if this is so, it will then add a light to the token, decrement the resource count, and schedule it to go out in the relevant amount of time for the duration of that light source.

### Light Spells

The module checks for the presence of either C1.4 Light Spell or C3.1 Continual Light in the character's spells list. If both are present, it uses CL3.1 first.

### Durations

The module uses the [about-time](https://foundryvtt.com/packages/about-time) module to manage durations. It also provides a simple Clock macro to bring up the Simple Calendar UI so, as a GM, you can advance time appropriately (e.g. advance a *turn* if the party is searching, etc.)

As per the Old School Essentials rules, the supported resources have the following durations:
|Resource | Duration|
|---------|---------|
| torch   |  1 hour |
| lantern + oil flask |  4 hours|
| Light Spell | 2 hours |
| Continual Light Spell | Until cancelled |

