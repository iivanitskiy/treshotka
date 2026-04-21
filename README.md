# 🎥 Трещотка

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Agora](https://img.shields.io/badge/Agora-RTC-00b4d8?style=flat-square&logo=agora)](https://www.agora.io/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.0-0170fe?style=flat-square&logo=ant-design)](https://ant.design/)

> **Компактное приложение для видеочата** , аудио звонков и текстового чата с функцией записи трансляций

🔗 **Демо:** [https://treshotka.vercel.app/](https://treshotka.vercel.app/)

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 🔐 **Аутентификация** | Регистрация и вход через Firebase Auth |
| 🎮 **Лобби** | Создание/вход в комнаты с поддержкой паролей |
| 🎥 **Видеозвонок** | Качественная видеосвязь через Agora RTC |
| 👥 **Список участников** | Отслеживание всех участников в комнате |
| 💬 **Чат в реальном времени** | Обмен сообщениями через Firestore |
| 📹 **Запись трансляции** | Возможность записи для администратора комнаты |
| 📱 **Адаптивный дизайн** | Полная поддержка мобильных устройств |

---

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```
Запуск в режиме разработки
```bash
npm run dev
```
Сборка проекта
```bash
npm run build
```
Запуск тестов
```bash
npm test
```
Линтинг кода
```bash
npm run lint
```
Проверка типов TypeScript
```bash
npx tsc --noEmit
```
🔧 Переменные окружения

Создайте файл .env.local в корне проекта и добавьте следующие переменные:

# Firebase Configuration
- NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
- NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
- NEXT_PUBLIC_FIREBASE_DATABASE_URL=... (Для отображения статуса участника online/offline)

# Agora Configuration
- NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

📁 Структура проекта
```text
src/
├── app/                   # Страницы App Router
│   ├── Login/             # Страница входа
│   ├── Register/          # Страница регистрации
│   ├── Lobby/             # Лобби комнат
│   └── Room/              # Комната видеочата
├── components/            # React компоненты
│   ├── VideoCall/         # Видеозвонок
│   ├── Chat/              # Чат
│   ├── RoomList/          # Список комнат
│   └── ...
├── lib/                   # Сервисы и утилиты
│   ├── services/          # Firebase, Agora сервисы
│   ├── config/            # Конфигурации
│   ├── store/             # Redux store
│   └── utils/             # Вспомогательные функции
```
🛠️ Технологический стек
* Фреймворк	Next.js 16 (App Router)
* Язык	TypeScript
* Управление состоянием	Redux Toolkit
* База данных и Auth	Firebase (Firestore, Auth)
* Видеосвязь	Agora RTC
* UI библиотека	Ant Design
* Запись видео	RecordRTC
