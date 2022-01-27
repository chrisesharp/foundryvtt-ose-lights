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

The module comes with 3 macros - Torch, Lantern and Light Spell. If you enable Player usage, you should share their visibility with your players.

Clicking on one of the macros, whilst having a token selected, will then do the following:

- check if the token already has a light source on
- if it does, it will turn off that light source
- if it doesn't, it will then check if the token has the necessary resources to use that kind of light source,
- if this is so, it will then add a light to the token, and schedule it to go out in the relevant amount of time

