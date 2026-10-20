# Hindi review: hi.draft.json -> hi.json

Style: everyday conversational Hindi, polite आप form, with common loanwords (WhatsApp, UPI, PIN कोड, कार्ट, साइज़, रंग, डिलीवरी, QR) and Western digits.
All 300 entries were checked against strings.json. 17 entries changed. The draft was already good: terminology was consistent and no stray characters or matra errors were found.

Terms used across the whole catalog: कार्ट, साइज़, रंग, डिलीवरी, ऑर्डर, पेमेंट (करें), जोड़ें, कन्फ़र्म, मैसेज, सेव, रग/मैट, रोएँ (pile), बैकिंग, फ़्री.

## Validation (script: ../hi_validate.py)
PASS, 0 errors: all 300 ids are present and there are no extras or empty strings. Placeholder sets are identical. Tag multisets are identical for rich entries and for pattern entries that contain `<b>`. The only Latin text is the brand, range and colour names, app names, UPI/PIN/QR/ID/BCF, size letters, measurement units, the email and UPI ID, and “scan from gallery”. There are no zero-width characters or double spaces. Every hero accent is an exact substring at the end of its headline. zoom.try matches fit.title with the `<em>` removed.

## Corrections (id: before -> after, why)
1. **zoom.hint.mouse**: `… अगले रंग के लिए ऐरो की` -> `… अगले रंग के लिए ऐरो बटन दबाएँ`. "की" (key) reads as the possessive की, so the line looked cut off. The new text also adds the missing verb.
2. **prod.chen.desc**: `उभरी बुनावट वाला शनील` -> `उभरी बुनावट वाला Chenille`. "Chenille" must stay in English, and the draft's शनील clashed with "Chenille मैट" everywhere else on the page.
3. **pay.todo.pay**: `<b>पेमेंट करें: <span id="payamt"></span></b>, UPI से नीचे दी गई ID पर।` -> `नीचे दी गई UPI ID पर <b>पेमेंट करें: <span id="payamt"></span></b>।`. The draft's word order was broken. The new order also reads correctly when payamt is "₹X + डिलीवरी (कन्फ़र्म होने पर)".
4. **hero.s6.t**: `… गर्म Mustard रंग के ज़िगज़ैग। 16×24 इंच वाला साइज़ ₹249 से।` -> `… गर्म Mustard रंग का Zigzag रग। 16×24 इंच साइज़ ₹249 से।`. "Zigzags" here means the product (the Zigzag range), so the range name stays in English. The phrasing is also smoother.
5. **fit.readout.fits**: `आपके {w} इंच के दरवाज़े में से {mat} इंच ढकता है` -> `आपके {w} इंच चौड़े दरवाज़े का {mat} इंच हिस्सा ढकता है`. The draft was unclear ("covers from inside the door"). The new text makes clear it means width.
6. **fit.spotlabel.door**: `{spot}, {w} इंच चौड़ाई` -> `{spot}, {w} इंच चौड़ा`. The label is about a door, so "मेन दरवाज़ा, 36 इंच चौड़ा" is the natural phrasing.
7. **fit.lead**: `पैरों की जोड़ी` -> `पैर`. "पैरों की जोड़ी" is a literal translation of "a pair of feet" and is not idiomatic.
8. **fit.caption**: `नाप समझने के लिए बड़े व्यक्ति के पैर` -> `नाप का अंदाज़ा लगाने के लिए बड़ों के पैर`. The draft was stiff. "बड़ों" means adults and is gender-neutral.
9. **common.copied**: `कॉपी हुआ` -> `कॉपी हो गया`. This is the idiomatic completed form.
10. **toast.saved**: `{colour} सेव किया` -> `{colour} सेव हो गया`. Changed to match the other confirmations (कॉपी हो गया, जुड़ गया).
11. **toast.unsaved**: `… से हटाया` -> `… से हटा दिया`. This is the natural completed form.
12. **cart.live.removed**: `हटाया गया` -> `हटा दिया गया`. Same reason as toast.unsaved.
13. **compare.open**: `साइज़ की तुलना` -> `साइज़ की तुलना करें`. Buttons use the imperative form everywhere else.
14. **fit.compare_all**: `सभी साइज़ की तुलना` -> `सभी साइज़ की तुलना करें`. Same reason as compare.open.
15. **pay.hello**: `बस थोड़ा सा बाकी, …` -> `लगभग हो गया, …`. The draft was missing है. The new text is a closer match for "Almost done".
16. **promise.aria**: `Soft Steps ही क्यों` -> `Soft Steps क्यों चुनें`. ही adds an unintended "why only" emphasis.
17. **faq.q6**: `क्या मिलने आ सकते हैं?` -> `क्या आपसे मिलने आ सकते हैं?`. Without आपसे the question had no object and was ambiguous.

## For the owner to double-check
- **contact.text** uses "जेलम पांचाल का बिज़नेस है". It deliberately avoids a gendered verb (चलाती/चलाते हैं). If you want "Soft Steps को … जेलम पांचाल चलाती हैं", confirm the preferred form.
- **pay.upi_name** and **faq.a2** keep "Jelam Panchal" in Latin script on purpose, because that is the payee name shoppers see in GPay/PhonePe. Elsewhere the name is written जेलम.
- **pay.qr.help** keeps “scan from gallery” in English. Check what the Hindi UI of GPay, PhonePe and Paytm actually shows and quote that if it differs.
- **fit.eyebrow** keeps `<span lang="gu">ઉંબરો</span>` with the gloss "आपकी दहलीज़ पर". The other option is देहरी with lang="hi".
- **hero.s1–s6**: the accent (`.a`) must stay an exact substring of the headline (`.h`) if anyone edits either one later.
- **Measurements**: the fit.suggest.* entries keep "in" (for example "20×32 in"), while running text uses इंच. Both are allowed. Pick one if you want strict uniformity.
- **Not covered**: /tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad/next/tryon.js now exists (about 42 KB), but strings.json has no entries from it apart from zoom.try. Its strings still need to be extracted and translated.
