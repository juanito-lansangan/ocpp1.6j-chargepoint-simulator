FROM php:7.4-fpm-alpine

RUN apk add freetype libpng libjpeg-turbo freetype-dev libpng-dev libjpeg-turbo-dev zip libzip-dev

RUN docker-php-ext-install pdo pdo_mysql bcmath zip
#RUN apk del --no-cache freetype-dev libpng-dev libjpeg-turbo-dev

RUN curl -sS https://getcomposer.org/installer | php

RUN mv composer.phar /usr/local/bin/composer

RUN chown -R www-data:www-data /var/www/html

CMD ["php-fpm"]