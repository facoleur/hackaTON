# Canet - Telegram-Native Service Booking with TON Payments

Canet is a Telegram Mini App that enables anyone to offer services through bookable time slots and receive payments in TON, directly inside Telegram.

### Vision

Turn every Telegram profile into a bookable, paid service powered by TON.

Launch the marketplace here: https://t.me/canette_marketplace_bot

### Overview

**Canet** transforms Telegram into a native service marketplace by combining scheduling and on-chain payments. Service providers can publish availability, and clients can instantly book and pay without leaving the chat environment.

### How It Works

**Providers**

- Create a service with price, duration, and optional deposit
- Define weekly availability
- Manage incoming bookings and mark sessions as completed

**Clients**

- Open the Mini App via Telegram
- Browse services and available time slots
- Book a slot and pay in TON
- Complete remaining payment after the service (if split payment is used)

### Payments

Payments are handled via TONConnect on the TON.

Two modes:

- Full upfront payment
- Split payment (deposit + final settlement)

All transactions are on-chain and linked to bookings.

### Booking Lifecycle

available → reserved → upfront_paid → completed → fully_paid

### Key Features

- Time slot-based booking system
- Telegram-native Mini App experience
- Instant TON payments
- Provider dashboard for availability and bookings
- Shareable booking links inside chats

### Why Telegram + TON

Built on Telegram Mini Apps, Canet leverages:

- Native distribution through chats and groups
- No installation or signup friction
- Seamless crypto payments via TON

### Tech Stack

- Frontend: Next.js (Telegram Mini App)
- Backend: Supabase (PostgreSQL)
- Payments: TONConnect
- State: React Query, Zustand

### Status

Prototype with working flows:

- Service creation
- Slot selection
- Booking
- TON payment integration



## Usage

This mini APP use the following technologies and libraries:

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x)
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI)



### Install Dependencies

If you have just cloned this template, you should install the project
dependencies using the command:

```Bash
pnpm install
```

### Scripts

This project contains the following scripts:

- `dev`. Runs the application in development mode.
- `dev:https`. Runs the application in development mode using self-signed SSL
  certificate.
- `build`. Builds the application for production.
- `start`. Starts the Next.js server in production mode.
- `lint`. Runs [eslint](https://eslint.org/) to ensure the code quality meets
  the required
  standards.

To run a script, use the `pnpm run` command:

```Bash
pnpm run {script}
# Example: pnpm run build
```

### Create Bot and Mini App

Before you start, make sure you have already created a Telegram Bot. Here is
a [comprehensive guide](https://docs.telegram-mini-apps.com/platform/creating-new-app)
on how to do it.

### Run

Although Mini Apps are designed to be opened
within [Telegram applications](https://docs.telegram-mini-apps.com/platform/about#supported-applications),
you can still develop and test them outside of Telegram during the development
process.

To run the application in the development mode, use the `dev` script:

```bash
pnpm run dev
```

After this, you will see a similar message in your terminal:

```bash
▲ Next.js 14.2.3
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in 2.9s
```

To view the application, you need to open the `Local`
link (`http://localhost:3000` in this example) in your browser.

It is important to note that some libraries in this template, such as
`@telegram-apps/sdk`, are not intended for use outside of Telegram.

Nevertheless, they appear to function properly. This is because the
`src/hooks/useTelegramMock.ts` file, which is imported in the application's
`Root` component, employs the `mockTelegramEnv` function to simulate the
Telegram environment. This trick convinces the application that it is
running in a Telegram-based environment. Therefore, be cautious not to use this
function in production mode unless you fully understand its implications.

### Run Inside Telegram

Although it is possible to run the application outside of Telegram, it is
recommended to develop it within Telegram for the most accurate representation
of its real-world functionality.

To run the application inside Telegram, [@BotFather](https://t.me/botfather)
requires an HTTPS link.

This template already provides a solution.

To retrieve a link with the HTTPS protocol, consider using the `dev:https`
script:

```bash
$ pnpm run dev:https

▲ Next.js 14.2.3
- Local:        https://localhost:3000

✓ Starting...
✓ Ready in 2.4s
```

Visiting the `Local` link (`https://localhost:3000` in this example) in your
browser, you will see the following warning:

![SSL Warning](assets/ssl-warning.png)

This browser warning is normal and can be safely ignored as long as the site is
secure. Click the `Proceed to localhost (unsafe)` button to continue and view
the application.

Once the application is displayed correctly, submit the
link `https://127.0.0.1:3000` (`https://localhost:3000` is considered as invalid
by BotFather) as the Mini App link to [@BotFather](https://t.me/botfather).
Then, navigate to [https://web.telegram.org/k/](https://web.telegram.org/k/),
find your bot, and launch the Telegram Mini App. This approach provides the full
development experience.

### Deploy

The easiest way to deploy your Next.js app is to use
the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out
the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for
more details.

### Useful Links

- [Platform documentation](https://docs.telegram-mini-apps.com/)
- [@telegram-apps/sdk-react documentation](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Telegram developers community chat](https://t.me/devs)