# RentaraH: Instagram carousel (6 slides, 1080 × 1350)

The slides are exported in order in `slides/rentarah-carousel-01.png` … `06.png`.

The screenshots come from the live preview at https://rentahub2026.github.io/, captured on 10 Oct 2026 in phone view: 390 × 844 CSS px at 3× density, rendered by `tools/capture.mjs`. To rebuild the slides after a UI change, run `node tools/capture.mjs` then `node tools/export.mjs`.

## Verified features and screens used

| Screen (route) | What the app really shows | Slide |
|---|---|---|
| Home (`/`) | "Need a ride in the Philippines?", a pickup city search, pick-up and return date/time, trip length, and the *Search available vehicles* button | 1, 6 |
| Browse (`/search?vt=car`) | Area and date bar with *Edit*, the *Choose price and type* filters, active filter chips, sort (*Recommended*), and listing cards showing location, distance, specs, host and a daily ₱ rate | 2, 6 |
| Filters sheet ("Choose what to show") | Vehicle (All / Car / Motorcycle / Scooter / Big bike), price per day slider, *Available dates only*, body type, transmission and fuel | 3 |
| Map (`/map`) | Search by city, area or landmark; All / Car / Moto chips; rental clusters; daily-rate pins; "32 vehicles nearby" with *View* | 4 |
| Car detail (`/cars/car_001`) | Photo gallery, *Share*, specs, price card with pick-up/return and trip length, a breakdown to *Total*, what's included, host card, *Sign in to reserve* | 5, 6 |

**What was left out on purpose:**
- **Marketing claims:** the "Why RentaraH" trust bullets (insured trips, verified hosts, secure payments, flexible) and the hero figures, which can't be verified before launch.
- **Reviews and ratings:** the demo ratings appear inside the screenshots but are never highlighted.
- **Things the brief ruled out:** native app or App Store claims, launch dates, listing counts and social handles.

**Notes:**
- Every slide is labelled "App preview · demo data", and the map slide adds "Map tiles © Esri".
- The browse slide uses the app's own **Car** filter because the demo motorcycle photos (Kawasaki Ninja 400, Ducati Monster, Yamaha MT-07) currently fail to load on the live site. Motorcycles still appear through the real filter and map chips.
- The suggested headline "Your next *place* starts here" was changed to **"Your next *ride* starts here"** because RentaraH rents vehicles, not property.

## Slide copy

1. **Brand introduction**
   - Kicker: RENT CARS & MOTORCYCLES
   - Headline: **Your next ride starts here.**
   - Support: Book a car or motorcycle from local hosts across the Philippines.
   - Badge: COMING SOON
   - Callouts: "Choose a pickup city" · "Set pick-up & return"
2. **Discover rentals**
   - Headline: **Browse rides, side by side.**
   - Support: Location, specs and the daily ₱ rate on every card.
   - Callouts: "Filters: price, type & more" · "Location & specs" · "Daily rate, kita agad"
3. **Find what fits**
   - Headline: **Filter it down in a few taps.**
   - Support: Car, motorcycle, scooter or big bike, plus your daily budget and available dates. Swak sa trip mo.
   - Callouts: "Vehicle type" · "Price per day" · "Body type"
4. **Explore the map**
   - Headline: **See rentals on the map.**
   - Support: Switch between All, Car and Moto, and spot daily rates right on the map.
   - Callouts: "Rental clusters" · "Daily rates pinned" · "Vehicles nearby → View"
5. **Explore the details**
   - Headline: **Know it before you book.**
   - Numbered points: ① Trip total, broken down, before you reserve · ② Pick-up & return, with trip length · ③ Specs & what's included
6. **Launch announcement**
   - Logo: RentaraH
   - Badge: **COMING SOON BY MOMENTRA LABS**
   - Line: **Follow us for launch updates.** Abangan!

## Instagram caption

> Finding the perfect ride shouldn't be complicated. 🚗🏍️
>
> Meet **RentaraH**, a new way to rent cars and motorcycles from local hosts across the Philippines. Here's a sneak peek at the real app:
>
> 🔎 Browse rides with location, specs and the daily ₱ rate on every card
> 🎛️ Filter by car, motorcycle, scooter or big bike, plus your budget per day
> 🗺️ See rentals on the map, then check the full trip total before you reserve
>
> **Coming soon by Momentra Labs.** Follow us for launch updates. Abangan! 🔔
>
> Swipe → to see how it works.

## Hashtags

#RentaraH #ComingSoon #MomentraLabs #CarRentalPH #MotorcycleRental #RoadTripPH #YourJourneyYourChoice

## Alt text

1. Promo slide with the headline "Your next ride starts here." and a "Coming soon" badge beside a phone showing the RentaraH home screen. Callouts point to the pickup city field and the pick-up and return dates.
2. Promo slide titled "Browse rides, side by side." with a phone showing RentaraH's browse screen in Metro Manila: a filters button, a listing card for a 2023 Porsche Cayenne in Makati with specs, and a daily rate of ₱12,000. Callouts point to filters, location and specs, and the daily rate.
3. Promo slide titled "Filter it down in a few taps." with a phone showing the RentaraH filter sheet: vehicle type chips (All, Car, Motorcycle, Scooter, Big bike), a price-per-day slider, an available-dates toggle, and body type options. Callouts point to vehicle type, price per day and body type.
4. Promo slide titled "See rentals on the map." with a phone showing the RentaraH map of the Philippines: All, Car and Moto filter chips, a cluster of 30 rentals, daily-rate pins, and a "32 vehicles nearby" bar with a View button.
5. Promo slide titled "Know it before you book." with two phones showing a RentaraH listing for a 2023 Toyota Fortuner. Numbered markers point to the trip total breakdown, the pick-up and return dates, and the specs and included features.
6. Closing slide with the RentaraH logo, a "Coming soon by Momentra Labs" badge and the line "Follow us for launch updates. Abangan!", above three phones showing the home, browse and car detail screens.
