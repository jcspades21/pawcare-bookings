# PawCare Bookings

A browser-based pet grooming appointment booking application. Pet owners
select a grooming service, pick an available time slot, and submit their
info to (eventually) create a Google Calendar event, log a booking record
in a Google Sheet, and receive a confirmation email plus a reminder email
the day before the appointment.

Built for MO-IT161 Web Systems and Technology — Milestone 1 (Weeks 2–5).

## Group Members
- Jan Carlos Mah
- Ela Abigail Acal
- Jenny Rose Villaroza
- Roselyn Lumbao

## Project Status (Milestone 1)

This milestone covers the frontend-only stage of the project:

- **HTML** — semantic structure for all core sections: services, how-it-works,
  booking form, business hours, contact form, footer.
- **CSS** (`style.css`) — layout, typography, reusable component classes
  (`.btn`, `.form-group`, `.service-card`, slot-picker states), and a
  responsive layout.
- **JavaScript** (`script.js`) — interactive features:
  - Service selection sync between the Services section and the booking form
  - A generated Time Slot List with simulated availability per date
  - Booking form validation (including custom checks for pet size and time
    slot selection) and a dynamic confirmation summary
  - A live character counter on the Contact form's message field

**Not yet implemented** (planned for later milestones): Google Calendar
event creation, Google Sheet booking log, confirmation/reminder emails, and
dynamic service data loaded from a Sheet. The current Time Slot List uses a
simulated availability formula in the browser, not a real Calendar read —
this is called out in code comments in `script.js`.

## File Structure

```
pawcare-bookings/
├── index.html      # Main page structure
├── style.css        # Styling and layout
├── script.js         # Interactive behavior
├── images/            # Banner and service image assets
└── README.md
```

## Viewing the Website

Visitors can open the deployed website at:

**https://jcspades21.github.io/pawcare-bookings/**

To enable or check GitHub Pages, open the repository's **Settings > Pages**
menu and configure it to deploy from the `main` branch and the `/ (root)`
folder. Leave the **Custom domain** field empty unless you own a separate
domain name. The GitHub Pages URL above is a project URL, not a custom domain.

## Running Locally

No build step is required. Clone the repository, then serve the folder with a
local static server:

```bash
git clone https://github.com/jcspades21/pawcare-bookings.git
cd pawcare-bookings
python3 -m http.server 8000
```

Open **http://localhost:8000** in a browser. Opening `index.html` directly
also works, but a local server is more reliable for loading assets.

## Workflow Documentation

Implementation decisions, priorities, and progress tracking for this
project are documented in the team's **Browser-Based Application
Development Workflow Worksheet** (Google Sheet), updated weekly alongside
this repository.
