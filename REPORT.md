# Pomodoro Timer: Comparing Three Development Approaches

## Project Overview

This project contains three independently runnable Pomodoro applications. Each includes focus and break sessions, start/pause/reset controls, configurable durations, a Node.js backend with a JSON API, and its own JSON file for persisted focus-session history. No third-party dependencies are required.

The project contains the three approaches required by the assignment:

- **Hand**: a deliberately direct, rough-around-the-edges frontend with casual variable names, paired with its own compact Node.js backend and session file.
- **Agent**: a frontend with descriptive names and extensive function decomposition, paired with its own deliberately explicit backend implementation and session file.
- **Together**: the collaborative version with a cleaner interface, a separately structured Node.js API, and its own session file.

## Comparison

| Version | Characteristics | Strengths | Trade-offs |
|---|---|---|---|
| Hand | Short, rough client and compact backend | Quick to read and change initially | Harder to maintain; backend style is intentionally informal |
| Agent | Detailed client and verbose, explicitly decomposed backend | Responsibilities and validation steps are easy to inspect | More code and structure than this small app requires |
| Together | Polished client and independent backend with local persistence | Balances collaboration, readability, and full-stack functionality | Requires starting its own Node server |

## Experience Report Draft

I compared three implementations of the same Pomodoro timer. The simplest version produced a visible result quickly, but adding pause, focus/break transitions, and completed-round tracking made the relationships between state variables more important. Naming and function boundaries affected how quickly I could understand the code: the casual version was shorter, but it took more effort to identify what each variable represented; the more explicitly structured version was easier to inspect, although it felt like more code than the small application strictly needed.

The collaborative approach works well when the basic requirements are agreed on first and additional structure is chosen together. Each version now has its own Node.js HTTP server, session API, and JSON-file persistence, so each can be run and tested independently. My main takeaway is that AI can help produce an initial draft and suggest implementation options, but I still need to run every app, test pausing, resetting, mode changes, API writes, and restored data, and decide whether the implementation meets the requirements. Generated code is not automatically verified code.

**Before submitting, revise this draft to describe your actual process.** All three versions in the current workspace were generated with AI to demonstrate different styles. The Hand version imitates a hand-written style; it is not evidence that you personally wrote every line. If the assignment requires personally hand-writing code or reporting your actual time, errors, and revisions, rewrite or modify that version yourself and describe the experience honestly.

## Personal Notes (Complete Before Submission)

- Date I actually modified/tested the project:
- Versions and interactions I personally tried:
- Approximate time spent on each version:
- One problem I encountered and how I addressed it:
- My preferred version and why:
- What AI helped with, and what I still needed to verify:

## Running and Testing

1. Start each version separately with `npm run start:hand`, `npm run start:agent`, or `npm run start:together` (see `README.md`).
2. Start the timer, then test pausing and resetting.
3. Temporarily set a duration to one minute and check the mode transition and completed-round count.
4. Each version syncs completed focus rounds with its own `/api/sessions`; records are stored in that version's `data/sessions.json` and are not shared across versions.

## Notes

This is a local learning demo without accounts, user separation, or cloud sync. The timer display is updated with a browser interval; background throttling or device sleep can make it unsuitable for precision timing. A production version could calculate remaining time from a target end timestamp and add automated tests, data backups, and sound/notification preferences.
