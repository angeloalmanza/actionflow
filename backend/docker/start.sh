#!/bin/sh
set -e

export PORT=${PORT:-8080}

chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

if [ -z "$APP_KEY" ]; then
    php artisan key:generate --no-interaction
fi

php artisan config:cache
php artisan route:cache
php artisan migrate --force --no-interaction

php-fpm -D

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

nginx -g "daemon off;"
