# FixIt Campus for Northwestern Visayan Colleges

School facility reporting and maintenance management for **Northwestern Visayan Colleges (NVC), National Highway, Estancia, Kalibo, Aklan**. Burgundy, white and gold; installable as a mobile app (PWA).

## Files
```
index.html            app shell
css/styles.css        styles (mobile bottom nav, desktop sidebar dashboard)
js/app.js             all logic: auth, validation, matching, status tracking
sw.js                 service worker (cache version fixit-v3)
manifest.webmanifest  PWA manifest, icon-*.png
assets/               nvc-logo.png and campus-banner.jpg go here (see assets/README.md)
tests/e2e_test.py     browser test (Playwright)
```

## Accounts
- **Login:** username and password only (username is not case sensitive). Password visibility toggle included.
- **Admin demo account:** `admin` / `admin`. Demonstration only; replace with real authentication before real use.
- **Student registration:** full name, unique username, date of birth, student ID number, grade/section, email, mobile, address, guardian, school ID photo, password (8+ characters) and confirmation. Invalid fields turn red with a message, and typed values are kept.
- **Verification:** new students can log in and view completed tasks, but filing reports is locked until an admin verifies the school ID photo (Users page).
- **Existing accounts (migration):** accounts made before usernames existed get one automatically: their **student ID number** (a number is added if two collide, e.g. `2023-7772`). Existing passwords, reports and history are kept. A "Your username is ..." note appears on their first login, and admins can see every username in Users.

## Roles
- **Student:** Home (completed tasks, search), New report, My reports (own reports, status, history).
- **Admin:** issue queue (search, status filter), assign manually, status updates, matching scores and workloads, student ID review, maintenance team (add staff, change capacity, deactivate).

## Algorithms
1. **Matching:** score 0-100 = 50% skill + 30% free capacity + 20% zone closeness. Staff at their limit or inactive are skipped. If nobody qualifies the report stays Pending and is matched again, most urgent first, when capacity frees up.
2. **Status tracking:** Pending > Assigned > In Progress > Resolved > Closed (Resolved can reopen). Every change is time-stamped; urgency deadlines (4h, 24h, 72h, 120h) flag overdue reports.

## Deploy on GitHub Pages
1. Replace the files in your repository with this folder's contents (upload through **Add file > Upload files**, or `git add . && git commit -m "NVC upgrade" && git push`). Keep the folder structure (`css/`, `js/`, `assets/`).
2. **Settings > Pages > Deploy from a branch > main / (root)**.
3. Open `https://<username>.github.io/school-facility-reporting/`. If you still see the old design, hard refresh once (the service worker cache is now `fixit-v3`).

## Limitations (important)
This is a frontend-only demonstration. Data (accounts, ID photos, reports) is stored in each browser's localStorage, so it is not shared between devices, not truly secure, and passwords are only hashed in the browser. For real use, add a backend (for example Supabase or Firebase, or Node with a database) with server-side authentication, authorization, validation and private storage for ID photos. Do not use real student data in this version.
