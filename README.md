# Focus Pomodoro — Hand / Agent / Together

A small full-stack Pomodoro timer with a native HTML/CSS/JavaScript frontend, a Node.js HTTP server, and JSON-file persistence. No third-party dependencies are required.

## Run the App

Install Node.js 18 or newer. From the project root, run `npm start`, then open <http://localhost:3000>.

The project contains exactly the three approaches required for the assignment:

- `/hand` — Hand: a deliberately simple, hand-written-style version
- `/agent` — Agent: a more explicit and heavily structured version
- `/together` — Together: the collaborative version and the full-stack implementation (default home page)

Open the pages through the Node server. Opening the HTML files directly will prevent the browser from reaching the same-origin API.

## API

- `GET /api/health`: check whether the server is running
- `GET /api/sessions`: retrieve recently saved focus sessions
- `POST /api/sessions`: save a completed focus round. Example JSON body: `{"mode":"focus","durationSeconds":1500}`

Together session history is stored in `data/sessions.json`, with up to the latest 500 records retained. This is a local, single-user demo without authentication or multi-user separation.
