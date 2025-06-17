FROM nginx:alpine AS final

COPY ./src/ /usr/share/nginx/html
