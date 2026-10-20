import json, sys
B = sys.argv[1]
cat = json.load(open(B + "/strings.json"))
draft = json.load(open(B + "/gu.draft.json"))
tryon = json.load(open(B + "/gu.tryon.draft.json"))["entries"]
FIX = {
 "hero.s6.t": "મુખ્ય દરવાજા કે બાલ્કની માટે હૂંફાળા Mustard રંગના Zigzag રગ. 16×24 ઇંચની સાઇઝ ₹249થી શરૂ.",
 "pay.todo.pay": 'નીચે આપેલા UPI ID પર <b>પેમેન્ટ કરો: <span id="payamt"></span></b>.',
 "cart.title.pay": "પેમેન્ટ કરીને મોકલો",
 "pay.amount.out": "{price} + ડિલિવરી (કન્ફર્મ થયા પછી)",
 "pay.hello": 'લગભગ થઈ ગયું, <span id="oname"></span>',
 "details.back": "પાછળ",
 "prod.ask": "{colour} ({size}) સ્ટોકમાં છે કે નહીં, પૂછો",
 "spec.weight.value": "Zigzag M નું 300 g થી લઈને Solid XL નું 1715 g સુધી",
 "pin.india": "આખા ભારતમાં ડિલિવરી: ચાર્જ અલગથી, ફોન પર કન્ફર્મ થશે. અમે WhatsApp પર કન્ફર્મ કરીશું.",
 "faq.a3": "હા. વડોદરામાં ડિલિવરી ફ્રી છે. બાકીના ભારત માટે ડિલિવરી ચાર્જ અલગથી લાગે છે, જે અમે ફોન પર તમારી સાથે કન્ફર્મ કરીએ છીએ.",
 "fit.lead": "જગ્યા અને સાઇઝ પસંદ કરો. મેટ, દરવાજો અને બે પગ, બધું એક જ પ્રમાણમાં દોરેલું છે.",
 "fit.readout.fits": "<b>{size}</b> તમારા {w} ઇંચ પહોળા દરવાજાનો {mat} ઇંચ ભાગ ઢાંકે છે, ને બંને બાજુ {spare} ઇંચ જગ્યા વધે છે.",
 "common.copied": "કોપી થઈ ગયું",
}
out = {}
for e in cat:
    out[e["id"]] = FIX.get(e["id"], draft[e["id"]])
for e in tryon:
    out[e["id"]] = e["gu"]
changed = [k for k in FIX if FIX[k] != draft[k]]
json.dump(out, open(B + "/gu.json", "w"), ensure_ascii=False, indent=2)
open(B + "/gu.json", "a").write("\n")
print("changed", len(changed), "total", len(out))
