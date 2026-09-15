FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY game-core.js /usr/share/nginx/html/game-core.js
COPY advanced-core.js /usr/share/nginx/html/advanced-core.js
COPY app.js /usr/share/nginx/html/app.js

EXPOSE 80
