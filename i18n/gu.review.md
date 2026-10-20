# Gujarati review: gu.draft.json -> gu.json

Style: everyday Vadodara Gujarati, polite તમે form, with the loanwords people actually use (WhatsApp, UPI, પિન કોડ, કાર્ટ, સાઇઝ, રંગ, ડિલિવરી, QR, કન્ફર્મ, પેમેન્ટ) and Western digits.
I checked all 300 catalog entries against strings.json and changed 13. I also reviewed the 30 proposed tryon.* entries in gu.tryon.draft.json and changed none of them. Overall the draft was good. Its spelling and matras are correct, it has no stray characters, and its terminology is mostly consistent.

Terms used across the whole catalog: કાર્ટ, સાઇઝ, રંગ, ડિલિવરી, ઓર્ડર, પેમેન્ટ (કરો), ઉમેરો, કન્ફર્મ, મેસેજ, સેવ, કોપી, નંગ (quantity), પ્રકાર (range), રેસા (pile), તળિયું (backing), ફરસ (floor), રગ / મેટ, "tap" = દબાવો.

## Validation (script: .work/gu_validate.py)
PASS, 0 errors on 330 entries (300 from the catalog plus 30 from tryon):
- every id is present, with no extras and no empty strings
- placeholder multisets and tag multisets are identical to the English for every entry
- the HTML in rich entries parses
- there are no Gujarati digits, Devanagari, zero-width characters or double spaces
- all numbers and fixed tokens survive: ₹249, the UPI ID, phone numbers, the email, © 2026, ±5% and ♡
- the only Latin is the brand, range and colour names, app names, UPI/ID/QR/BCF/JPG/PNG/Shift, size letters, in/g, the payee name and “scan from gallery”
- every hero accent is an exact substring at the end of its headline
- the button text inside pay.help equals pay.copy_order
- fit.title without `<em>` equals zoom.try, which equals tryon.title

## Corrections (id: before -> after, why)
1. **pay.todo.pay**: `નીચે આપેલા UPI ID પર <b><span id="payamt"></span> ચૂકવો</b>.` -> `નીચે આપેલા UPI ID પર <b>પેમેન્ટ કરો: <span id="payamt"></span></b>.`. "ચૂકવો" was the only place that did not use the catalog's word for pay (પેમેન્ટ). The new order also still reads correctly when payamt is "₹X + ડિલિવરી (કન્ફર્મ થયા પછી)".
2. **cart.title.pay**: `ચૂકવો અને મોકલો` -> `પેમેન્ટ કરીને મોકલો`. This uses the same pay term, and "પેમેન્ટ કરીને મોકલો" (pay, then send) is how people actually say it.
3. **hero.s6.t**: `… હૂંફાળા Mustard ઝિગઝેગ.` -> `… હૂંફાળા Mustard રંગના Zigzag રગ.`. "Mustard zigzags" refers to the Zigzag range product, so the range name stays in English. The draft also lacked a noun.
4. **fit.readout.fits**: `તમારા {w} ઇંચના દરવાજામાં {mat} ઇંચ જગ્યા રોકે છે` -> `તમારા {w} ઇંચ પહોળા દરવાજાનો {mat} ઇંચ ભાગ ઢાંકે છે`. The draft said the mat "takes up space in the door". The English says it covers part of the door's width.
5. **pay.amount.out**: `(નક્કી થયા પછી)` -> `(કન્ફર્મ થયા પછી)`. "Confirmed" is કન્ફર્મ everywhere else in the catalog.
6. **pin.india**: `ચાર્જ અલગથી, જે ફોન પર નક્કી કરીશું.` -> `ચાર્જ અલગથી, ફોન પર કન્ફર્મ થશે.`. This removes the dangling "જે" clause and uses the same confirm term.
7. **faq.a3**: `ડિલિવરી ચાર્જ અલગથી થાય, જે…` -> `ડિલિવરી ચાર્જ અલગથી લાગે છે, જે…`. In Gujarati, charges "લાગે". "થાય" is unidiomatic, and the sentence was missing છે.
8. **pay.hello**: `બસ હવે થોડું જ બાકી, …` -> `લગભગ થઈ ગયું, …`. This is closer to "Almost done", and the draft was missing છે.
9. **details.back**: `પાછા` -> `પાછળ`. On its own, પાછા sounds unfinished ("back… what?"). પાછળ is the usual label for a back button.
10. **prod.ask**: `{colour} ({size}) સ્ટોકમાં છે? પૂછો` -> `{colour} ({size}) સ્ટોકમાં છે કે નહીં, પૂછો`. The question mark in the middle of a link read as two broken fragments.
11. **spec.weight.value**: `zigzag M માટે 300 g થી solid XL માટે 1715 g સુધી` -> `Zigzag M નું 300 g થી લઈને Solid XL નું 1715 g સુધી`. The range names are now capitalised like everywhere else, and "M નું … થી લઈને" is the natural phrasing for a range of weights.
12. **fit.lead**: `એક જ માપે દોરેલું` -> `એક જ પ્રમાણમાં દોરેલું`. "To the same scale" is પ્રમાણ. "માપે" reads as "the same size", which is wrong because the feet are not the size of the mat.
13. **common.copied**: `કોપી થયું` -> `કોપી થઈ ગયું`. This is the idiomatic completed form. The button grows by about 3 characters.

## For the owner / developer to double-check
- **fit.add.aria and tryon.js**: tryon.js (around line 630) parses the fit tool's Add button aria-label with `/^Add (Zigzag|Solid Premium) (?:M|H|L|XL) in (.+), ₹/`. If fit.add.aria is swapped to Gujarati or Hindi, that regex stops matching and the try-on button loses its suggested range and colour. The code should read the values from data, not from the translated label.
- **tryon.\* ids**: gu.json includes 30 proposed `tryon.*` ids from gu.tryon.draft.json. They are not in strings.json yet. When the catalog is rescanned, keep these ids or rename them in all three languages. tryon.js was re-read at the end of this review and no strings had changed, only geometry constants.
- **રગ**: the whole catalog uses રગ for "rug" (doormat = ડોરમેટ, mat = મેટ). Many Gujarati families would say ગાલીચો or પગલૂછણિયું instead. I kept રગ because it matches the English range names, but the owner should confirm it sounds right to her customers.
- **hero.s2.t / prod.zig.desc**: "zigzag stripes" is written ઝિગઝેગ પટ્ટા because it describes the pattern there, not the range name. Change it to "Zigzag" if you want strict Latin script.
- **pay.qr.help**: this keeps “scan from gallery” in English. Check what GPay, PhonePe and Paytm show in Gujarati and quote that if it differs.
- **pay.upi_name / faq.a2**: these keep "Jelam Panchal" in Latin script on purpose, because that is the payee name shoppers see in their UPI app. Elsewhere the name is જેલમ (પંચાલ).
- **Mat gender**: મેટ is treated as feminine (લાંબી XL મેટ, મેટ કેવી રીતે ધોવી) and રગ as masculine (પાછલો રગ). Product blurbs use the neutral "બનેલું".
- **Measurements**: fit.suggest.* and the weights keep "in" and "g" (20×32 in, 300 g). Running text uses ઇંચ.
- **hero.s1–s6**: if anyone edits a headline (`.h`) or its accent (`.a`) later, the accent must stay an exact substring at the end of the headline.
