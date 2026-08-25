# Clinic photographs

Every picture on the website is a replaceable slot. Nothing here is stock
imagery or AI-generated — an empty slot simply shows a designed placeholder
until a real photograph is added.

There are two ways to add photos.

## 1. Quick way — upload from the browser (no technical skill needed)

1. Open the website.
2. Scroll to the bottom and click **Manage Photos** in the footer
   (or add `?edit=1` to the address, e.g. `index.html?edit=1`).
3. Every picture frame on the page becomes highlighted with an
   **Upload photo** button. Click it and choose a picture.
4. Click **Done** when finished.

Photos added this way are stored in that browser only, so they are perfect for
previewing the site or checking how a picture looks before it goes live. They
are **not** visible to visitors on other devices.

Large pictures are resized automatically (longest edge 1700px), so photographs
straight from a phone are fine.

## 2. Permanent way — add the files to this folder

Save the photograph into this folder using the exact filename from the list
below, then publish the site. It will appear for every visitor, on every
device, and will take priority over nothing — a browser upload for the same
slot overrides it locally.

Use JPEG, keep the longest edge around 1600–2000px, and aim for under 400 KB
per file. The listed aspect ratio is the shape the design crops to, so framing
the subject near the centre gives the best result.

| Filename | Shown as | Ratio |
| --- | --- | --- |
| `dentist-hero.jpg` | Dr. Puri — main hero portrait | 4:5 portrait |
| `dentist-profile.jpg` | Dr. Puri — About the dentist | 4:5 portrait |
| `clinic-exterior.jpg` | Clinic exterior | 16:10 landscape |
| `clinic-reception.jpg` | Reception & waiting area | 16:10 landscape |
| `clinic-treatment-room.jpg` | Treatment room | 1:1 square |
| `clinic-equipment.jpg` | Dental equipment | 1:1 square |
| `clinic-dentist-at-work.jpg` | Dentist at work | 1:1 square |
| `gallery-portrait.jpg` | Gallery — dentist portrait | 3:4 portrait |
| `gallery-exterior.jpg` | Gallery — clinic exterior | 16:9 landscape |
| `gallery-interior.jpg` | Gallery — clinic interior | 1:1 square |
| `gallery-treatment-room.jpg` | Gallery — treatment room | 1:1 square |
| `gallery-treating-patient.jpg` | Gallery — treating a patient | 16:9 landscape |
| `gallery-equipment.jpg` | Gallery — dental equipment | 1:1 square |
| `gallery-procedure.jpg` | Gallery — a procedure | 1:1 square |
| `gallery-environment.jpg` | Gallery — clinic environment | 3:4 portrait |
| `gallery-extra-1.jpg` | Gallery — spare slot | 16:9 landscape |
| `gallery-extra-2.jpg` | Gallery — spare slot | 1:1 square |

### Treatment photographs

Each treatment has a card image (4:3) and a wider banner (16:7) shown inside
its **Learn More** window.

| Card image | Detail banner |
| --- | --- |
| `treatment-fillings.jpg` | `treatment-fillings-detail.jpg` |
| `treatment-root-canal.jpg` | `treatment-root-canal-detail.jpg` |
| `treatment-extraction.jpg` | `treatment-extraction-detail.jpg` |
| `treatment-cleaning.jpg` | `treatment-cleaning-detail.jpg` |
| `treatment-crowns.jpg` | `treatment-crowns-detail.jpg` |
| `treatment-implants.jpg` | `treatment-implants-detail.jpg` |
| `treatment-braces.jpg` | `treatment-braces-detail.jpg` |
| `treatment-whitening.jpg` | `treatment-whitening-detail.jpg` |
| `treatment-dentures.jpg` | `treatment-dentures-detail.jpg` |
| `treatment-pediatric.jpg` | `treatment-pediatric-detail.jpg` |

## Alt text

Each slot already carries descriptive alt text for screen readers and search
engines. If a photograph shows something different from what the slot
describes, update the `data-alt` attribute for that slot in `index.html`.

## Patient photographs

Please obtain a patient's consent before publishing any photograph in which
they are identifiable.
