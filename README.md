# The Common Athlete

A polished, responsive launch website for **The Common Athlete** — a Singapore-based,
women-first activewear and athleisure brand for everyday athletes.

> _Activewear for movement, comfort, and real life. Built for sweat. Designed for every day._

## What's inside

A complete, single-page brand launch site built with **plain HTML, CSS, and JavaScript** —
no build step, no dependencies. Just open it and run.

Sections: sticky nav with mobile menu · hero · brand promise strip · first-drop
product grid · the Everyday Set highlight · lifestyle tiles · about · fit & function
· waitlist form · pre-launch community notes · footer · and a working bag drawer.

## File structure

```
the-common-athlete/
├── index.html        # All page sections and markup
├── css/
│   └── styles.css    # Design tokens, layout, responsive styles
├── js/
│   └── main.js       # Mobile menu, bag drawer, forms, scroll reveal
└── README.md
```

## Run it locally

It's static, so just open `index.html` in your browser:

```bash
open index.html        # macOS
# or double-click the file
```

Or serve it (recommended, avoids any browser file restrictions):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customising

- **Colours & spacing** live as CSS variables at the top of `css/styles.css` (`:root`).
- **Fonts** are loaded from Google Fonts in `index.html` (Space Grotesk + Inter).
- **Product images** are elegant neutral placeholder blocks (`.ph` elements). Swap any
  `.ph` block for an `<img>` when real photography is ready.
- **Prices, copy, and colours** are plain text in `index.html`.

## Notes

- The bag/checkout is a front-end preview only — no payments are processed.
- The waitlist and newsletter forms show a success message but don't yet submit
  anywhere. Wire them to your email provider (e.g. Mailchimp, Klaviyo, a form service)
  when you're ready.
