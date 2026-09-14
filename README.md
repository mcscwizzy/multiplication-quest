# Multiplication Quest

A kid-friendly multiplication battle game built with vanilla HTML, CSS, and JavaScript.

## Run with Docker Compose

From this directory:

```bash
docker compose up --build
```

Then open:

- http://localhost:8080

Stop the app with:

```bash
docker compose down
```

## Files

- `index.html` — application markup
- `styles.css` — responsive game styling and animations
- `app.js` — game state, battles, progression, multiple-choice math engine
- `Dockerfile` — Nginx image for the static app
- `docker-compose.yml` — one-command local deployment
- `nginx.conf` — Nginx static-site configuration

## Game features

- Four selectable heroes
- Progressive multiplication worlds
- Randomized cartoon enemies
- Fixed world bosses
- Four-answer multiple-choice questions
- Health bars, counterattacks, streaks, shields, and bonus damage
- XP and levels
- Replayable completed worlds
- Progress saved in the browser with `localStorage`
- Keyboard shortcuts 1–4 during battles

## Port

The compose file maps container port 80 to host port 8080. To use another host port, change:

```yaml
ports:
  - "8080:80"
```

For example, `3000:80` serves the game at http://localhost:3000.
