# Focus Pomodoro — Hand / Agent / Together

A collection of three complete Pomodoro applications. Each version has its own HTML/CSS/JavaScript frontend, Node.js backend, API, and JSON session store. No third-party dependencies are required.

## Run the App

Install Node.js 18 or newer. From the project root, start one version with the matching command:

| Version | Command | Default URL |
|---|---|---|
| Hand | `npm run start:hand` | <http://localhost:3101> |
| Agent | `npm run start:agent` | <http://localhost:3102> |
| Together | `npm run start:together` or `npm start` | <http://localhost:3103> |

Each application runs independently. You can change its port with the `PORT` environment variable, for example `PORT=3011 npm run start:hand`.

Hand uses a deliberately rough, compact coding style. Agent uses explicit names and a more verbose structure. Together is the collaborative, polished version. Open each page through its own backend, rather than opening the HTML file directly, so its API can be reached.

## API

- `GET /api/health`: check whether that version's backend is running
- `GET /api/sessions`: retrieve that version's recently saved focus sessions
- `POST /api/sessions`: save a completed focus round. Example JSON body: `{"mode":"focus","durationSeconds":1500}`

Each app stores its own session history in its own `data/sessions.json` file, retaining up to 500 records. The apps do not share history. These are local, single-user demos without authentication or multi-user separation.
