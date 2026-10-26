# Pomodoro Timer: Comparing Three Development Approaches

## Project Overview

This project implements a Pomodoro timer with focus and break sessions, start/pause/reset controls, configurable durations, and completed-round tracking. The frontend uses native HTML, CSS, and JavaScript. A Node.js HTTP server serves the pages and JSON API, and completed focus sessions are persisted in a JSON file. No third-party dependencies are required.

The project contains the three approaches required by the assignment:

- **Hand**: a deliberately direct, rough-around-the-edges implementation with casual variable names, representing a beginner's hand-written style. It can load and save history through the backend while keeping the client code compact.
- **Agent**: an implementation with descriptive names and more function-level decomposition, representing an agent-generated style that favors explicit structure. It also uses the same history API, with the client work split into more descriptive functions.
- **Together**: a collaborative version intended to reflect decisions made through human-AI discussion. It shares the backend and local session persistence; it is not a fourth approach.

## Comparison

| Version | Characteristics | Strengths | Trade-offs |
|---|---|---|---|
| Hand | Short code, casual names, concentrated logic, basic session API calls | Quick to change and easy to follow at first | Harder to maintain and debug as it grows |
| Agent | Descriptive names, smaller functions, and explicit session API handling | Intent is clearer and individual parts are easier to inspect | Can feel verbose for a small project |
| Together | Moderate structure, a polished interface, and persisted completion history | Balances collaboration, readability, and frontend/backend functionality | Requires the Node server for session syncing |

## Experience Report Draft

I compared three implementations of the same Pomodoro timer. The simplest version produced a visible result quickly, but adding pause, focus/break transitions, and completed-round tracking made the relationships between state variables more important. Naming and function boundaries affected how quickly I could understand the code: the casual version was shorter, but it took more effort to identify what each variable represented; the more explicitly structured version was easier to inspect, although it felt like more code than the small application strictly needed.

The collaborative approach works well when the basic requirements are agreed on first and additional structure is chosen together. The Together version adds a Node.js HTTP server, a session API, and JSON-file persistence so completed focus rounds can be saved locally and today's total can be restored when the page is reopened. My main takeaway is that AI can help produce an initial draft and suggest implementation options, but I still need to run the app, test pausing, resetting, mode changes, API writes, and restored data, and decide whether the implementation meets the requirements. Generated code is not automatically verified code.

**Before submitting, revise this draft to describe your actual process.** All three versions in the current workspace were generated with AI to demonstrate different styles. The Hand version imitates a hand-written style; it is not evidence that you personally wrote every line. If the assignment requires personally hand-writing code or reporting your actual time, errors, and revisions, rewrite or modify that version yourself and describe the experience honestly.

## Personal Notes (Complete Before Submission)

- Date I actually modified/tested the project:
- Versions and interactions I personally tried:
- Approximate time spent on each version:
- One problem I encountered and how I addressed it:
- My preferred version and why:
- What AI helped with, and what I still needed to verify:

## Running and Testing

1. Run `npm start` from the project root and open `http://localhost:3000` (see `README.md`).
2. Start the timer, then test pausing and resetting.
3. Temporarily set a duration to one minute and check the mode transition and completed-round count.
4. All three versions sync completed focus rounds through `/api/sessions`; records are stored in `data/sessions.json`. The timers remain usable without the server, but history will not load or save.

## Notes

This is a local learning demo without accounts, user separation, or cloud sync. The timer display is updated with a browser interval; background throttling or device sleep can make it unsuitable for precision timing. A production version could calculate remaining time from a target end timestamp and add automated tests, data backups, and sound/notification preferences.
