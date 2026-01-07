# Трещотка

https://treshotka.vercel.app/

Компактное приложение видеочата на Next.js 16, TypeScript, Redux Toolkit, Firebase, Agora и Ant Design.

## Быстрый старт
- Установка: `npm install`
- Запуск dev-сервера: `npm run dev`
- Сборка: `npm run build`
- Тесты: `npm test`
- Линтер: `npm run lint`
- Проверка типов: `npx tsc --noEmit`

## Переменные окружения
Создайте `.env.local` и заполните ключи:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_AGORA_APP_ID=...
```

## Возможности
- Аутентификация (Firebase)
- Лобби: создание/вход, поддержка пароля
- Видеозвонок (Agora RTC), список участников
- Чат в реальном времени (Firestore)
- Запись трансляции для админа
- Адаптивный UI (Ant Design, глобальные стили)

## Структура
- `src/app` — страницы App Router (Login, Register, Lobby, Room)
- `src/components` — компоненты (VideoCall, Chat, RoomList и др.)
- `src/lib` — сервисы, конфигурации, утилиты, Redux
