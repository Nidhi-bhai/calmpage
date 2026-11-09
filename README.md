# Calmpage

**5 people on Hacker News said they'd pay for this. So I built it.**

Calmpage is a browser extension (plus a bookmarklet) that kills cookie banners, newsletter pop-ups, "open in app" bars, sticky headers and scroll locks, then shows any article in one readable design you pick. Same font, size and colors on every site.

Live: https://nidhi-bhai.github.io/calmpage/ · Try it: https://nidhi-bhai.github.io/calmpage/demo.html

## The asks (from [The Unbuilt Index](https://nidhi-bhai.github.io/unbuilt/))
- xpl, 2024: "I would pay money for a browser plugin that restyles every web page to a single readable/accessible design that I like." ([HN](https://news.ycombinator.com/item?id=40056016))
- bityard, 2022: "I would pay for a firefox or chrome extension that lets you just toggle the whole browsing session or tab into reader mode" ([HN](https://news.ycombinator.com/item?id=32999574))
- readonthegoapp, 2023: "I would pay for this. At least a buck a year. Maybe 5. Maybe 10… Best if I could pay monthly or every three months" ([HN](https://news.ycombinator.com/item?id=35228158))
- JoshTriplett, 2021: "I would happily pay for an Open Source adblocker-style extension that intentionally breaks 'do you want to download and install our app…' pop-ups." ([HN](https://news.ycombinator.com/item?id=28679004))
- fumblebee, 2021: "I would pay good money for a solution to the cookies popup problem." ([HN](https://news.ycombinator.com/item?id=27769985))

## Install (Chrome, Edge, Brave, Arc)
Download `docs/calmpage-extension.zip`, unzip, open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, pick the folder.

## Free vs Pro
- Free: pop-up killer on every site, reader on any tab (Alt+Shift+R), Paper or Dark design, bookmarklet.
- Pro ($3/month or $8 per 3 months via PayPal, 7 days free): session mode (every article in every tab opens calm), full design control, always-calm sites. The key is your PayPal subscription ID, checked offline.

## Privacy
No network requests, no analytics. Reader engine: [Mozilla Readability](https://github.com/mozilla/readability) (Apache-2.0, `extension/LICENSE.md`).

## Layout
- `extension/`: MV3 extension (`calm.js` is the core: overlay killer + reader)
- `docs/`: GitHub Pages site, demo page, bookmarklet bundle `cp.js`

Code outside Readability: MIT.
