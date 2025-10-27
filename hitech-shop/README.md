# HiTech Furniture (Static) v2.5

Готовая статическая версия под XAMPP/любой веб-сервер. Сейчас все данные — в localStorage. Позже легко переключить на /api (Node.js + PostgreSQL): см. assets/config.js.

Быстрый запуск локально:
1) Распаковать папку в C:/xampp/htdocs/hitech-shop
2) В XAMPP Control Panel → Apache: Start
3) Открыть http://localhost/hitech-shop/index.html

Что нового по сравнению с v2.4:
- Добавлен assets/config.js (флаг useApi). Пока useApi=false — всё локально. Когда развернём сервер, включим useApi=true и заменим логику загрузки данных на вызовы `${apiBase}`.
- Минорные правки и версия скрипта v=2.5

Фичи:
- Тёмная тема, поиск, категории, персональная корзина (для каждого пользователя отдельная), модалка профиля при покупке, личный кабинет и «Мои покупки».