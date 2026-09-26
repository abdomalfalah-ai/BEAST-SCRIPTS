# -*- coding: utf-8 -*-
"""Build the Beast Coaching reel scene file (self-contained HTML).
Embeds the real logo, coach portrait, and Arabic font as data URIs so the
Playwright frame-capture renders identically with no external fetches."""
import base64, os

_HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))  # repo root
OUT = os.path.join(_HERE, "reel.html")

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")

logo = "data:image/png;base64," + b64(os.path.join(ROOT, "logo_header.png"))
portrait = "data:image/jpeg;base64," + b64(os.path.join(ROOT, "static", "landing", "portrait.jpg"))
arfont = b64(os.path.join(ROOT, "NotoSansArabic-Bold.ttf"))
shots = {}
for _k, _fn in (("choose", "choose.png"), ("book", "book.png"), ("checkout", "checkout.png"), ("portal", "portal.png")):
    shots[_k] = "data:image/png;base64," + b64(os.path.join(_HERE, "_shots", _fn))

HTML = r"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<style>
@font-face{font-family:'ARB';src:url(data:font/ttf;base64,__ARFONT__) format('truetype');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
:root{--red:#e21f1f;--ink:#0c0c0c;--muted:#9aa0a6}
.stage{position:relative;width:1080px;height:1920px;background:radial-gradient(120% 80% at 50% 0%,#1a1a1a 0%,#000 60%);font-family:'Arial Black','Arial',sans-serif;color:#fff;overflow:hidden}
.ar{font-family:'ARB','Tahoma',sans-serif;direction:rtl}
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;padding:90px 70px;text-align:center}
.watermark{position:absolute;top:50%;left:50%;width:1500px;transform:translate(-50%,-50%);opacity:.05;filter:grayscale(1) brightness(2)}
.kicker{display:inline-block;background:var(--red);color:#fff;font-size:30px;letter-spacing:3px;padding:10px 22px;border-radius:999px;font-family:'Arial Black';margin-bottom:26px}
.huge{font-size:104px;line-height:1.02;letter-spacing:-1px;text-transform:uppercase}
.huge .red{color:var(--red)}
.subar{font-size:58px;margin-top:22px;color:#eee}
.redbar{height:10px;background:var(--red);border-radius:999px;margin:34px auto 0;width:0}
.cap{position:absolute;bottom:140px;left:0;right:0;padding:0 80px;text-align:center}
.cap .en{font-size:46px;font-weight:900}
.cap .ar{font-size:46px;color:var(--red);margin-top:8px}
.title{font-size:72px;text-transform:uppercase;line-height:1.05}
.title .red{color:var(--red)}
.titar{font-size:50px;color:#ddd;margin-top:10px}
/* phone showing a real website screenshot */
.phone{width:438px;height:898px;border-radius:56px;background:#080808;border:12px solid #141414;box-shadow:0 40px 120px rgba(226,31,31,.20),0 0 0 2px #000;margin-top:26px;padding:0;position:relative;overflow:hidden}
.phone .notch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:126px;height:24px;background:#0a0a0a;border-radius:999px;z-index:3}
.screen{position:absolute;inset:12px;border-radius:44px;overflow:hidden;background:#000}
.shot{width:100%;height:100%;object-fit:cover;object-position:top}
.scr{margin-top:40px;text-align:left}
.scr h3{font-size:34px;color:#fff;font-family:'Arial Black';margin:6px 0 4px}
.scr .mut{font-size:22px;color:#8a9097;font-family:'Arial';margin-bottom:16px}
.btnp{display:block;width:100%;border-radius:16px;padding:20px;font-size:26px;font-family:'Arial Black';margin-top:14px;text-align:center}
.btnp.red{background:var(--red);color:#fff}
.btnp.dark{background:#161616;color:#fff;border:2px solid #2a2a2a}
.inp{width:100%;background:#141414;border:2px solid #2a2a2a;color:#fff;border-radius:14px;padding:18px;font-size:24px;font-family:'Arial';margin-top:14px}
.tabs{display:flex;gap:10px;margin-top:6px}
.tab{flex:1;text-align:center;font-size:20px;font-family:'Arial Black';color:#8a9097;padding:12px 0;border-radius:12px;background:#121212}
.tab.on{color:#fff;background:var(--red)}
.tile{background:#121212;border:1px solid #222;border-radius:16px;padding:18px;margin-top:14px}
.tile .l{font-size:20px;color:#8a9097;font-family:'Arial'}
.tile .v{font-size:34px;color:#fff;font-family:'Arial Black';margin-top:4px}
/* stamp centred by a wrapper so the per-element animation transform can't push it off-screen */
.stampwrap{position:absolute;top:42%;left:0;right:0;display:flex;justify-content:center;transform:rotate(-11deg);z-index:4;pointer-events:none}
.stamp{border:7px solid #28d17c;color:#28d17c;font-size:38px;font-family:'Arial Black';padding:10px 22px;border-radius:16px;letter-spacing:2px;background:rgba(0,0,0,.45);white-space:nowrap}
.ring{display:block;margin:8px auto 0}
.portrait{width:430px;height:430px;border-radius:50%;object-fit:cover;border:8px solid var(--red);box-shadow:0 30px 90px rgba(226,31,31,.3)}
.report{background:#0e0e0e;border:1px solid #242424;border-radius:22px;padding:26px 30px;margin-top:30px;width:560px;text-align:left}
.report .rh{font-size:26px;color:#8a9097;font-family:'Arial';letter-spacing:2px}
.report .rrow{display:flex;justify-content:space-between;font-size:30px;margin-top:14px;font-family:'Arial Black'}
.logobig{width:560px}
.cta{font-size:96px;text-transform:uppercase;line-height:1.05;margin-top:10px}
.cta .red{color:var(--red)}
.handle{font-size:40px;color:#cfd3d7;font-family:'Arial';margin-top:26px}
.handle b{color:#fff}
.fadeup{opacity:0}
</style></head>
<body>
<div class="stage" id="stage">
  <img class="watermark" src="__LOGO__">

  <!-- S1 HOOK -->
  <div class="scene kb" data-start="0" data-end="4.6">
    <div class="huge"><span data-in="0.2">BECOME THE</span><br><span class="red" data-in="0.45">STRONGEST</span><br><span data-in="0.7">VERSION OF YOU</span></div>
    <div class="redbar" data-in="0.9" data-grow="520"></div>
    <div class="subar ar" data-in="1.2">ابنِ أقوى نسخة من نفسك</div>
  </div>

  <!-- S2 CHOOSE PATH -->
  <div class="scene" data-start="4.6" data-end="9.2">
    <div class="kicker" data-in="4.8">STEP 1</div>
    <div class="title" data-in="4.95">Choose your <span class="red">path</span></div>
    <div class="titar ar" data-in="5.15">ابدأ من موقعنا — اختر طريقك</div>
    <div class="phone" data-in="5.3" data-ty="60">
      <div class="notch"></div>
      <div class="screen"><img class="shot" src="__SHOT_CHOOSE__"></div>
    </div>
  </div>

  <!-- S3 APPLY / BOOK -->
  <div class="scene" data-start="9.2" data-end="13.8">
    <div class="kicker" data-in="9.4">STEP 2</div>
    <div class="title" data-in="9.55">Apply or <span class="red">book a call</span></div>
    <div class="titar ar" data-in="9.75">اختر باقتك أو احجز مكالمة مجانية</div>
    <div class="phone" data-in="9.9" data-ty="60">
      <div class="notch"></div>
      <div class="screen"><img class="shot" src="__SHOT_BOOK__"></div>
    </div>
  </div>

  <!-- S4 PAY -->
  <div class="scene" data-start="13.8" data-end="17.8">
    <div class="kicker" data-in="14.0">STEP 3</div>
    <div class="title" data-in="14.15">Pay <span class="red">securely</span></div>
    <div class="titar ar" data-in="14.35">ادفع بأمان — وتأكيد فوري</div>
    <div class="phone" data-in="14.5" data-ty="60">
      <div class="notch"></div>
      <div class="screen"><img class="shot" src="__SHOT_CHECKOUT__"></div>
      <div class="stampwrap"><div class="stamp" data-in="16.0" data-ty="0">CONFIRMED ✓</div></div>
    </div>
  </div>

  <!-- S5 PORTAL -->
  <div class="scene" data-start="17.8" data-end="22.6">
    <div class="kicker" data-in="18.0">STEP 4</div>
    <div class="title" data-in="18.15">Your private <span class="red">application</span></div>
    <div class="titar ar" data-in="18.35">تطبيقك الخاص — تابع كل حاجة</div>
    <div class="phone" data-in="18.5" data-ty="60">
      <div class="notch"></div>
      <div class="screen"><img class="shot" src="__SHOT_PORTAL__"></div>
    </div>
  </div>

  <!-- S6 COACH -->
  <div class="scene" data-start="22.6" data-end="27.0">
    <div class="kicker" data-in="22.8">STEP 5</div>
    <div class="title" data-in="23.1">Your coach is with you <span class="red">step by step</span></div>
    <div class="titar ar" data-in="23.35">الكابتن معاك خطوة بخطوة</div>
    <div class="report" data-in="23.9" data-ty="50">
      <div class="rh">MONTHLY PROGRESS REPORT · التقرير الشهري</div>
      <div class="rrow"><span>Adherence</span><span style="color:#28d17c">On track</span></div>
      <div class="rrow"><span>Plan</span><span style="color:var(--red)">Adjusted</span></div>
    </div>
  </div>

  <!-- S7 CTA -->
  <div class="scene" data-start="27.0" data-end="30">
    <img class="logobig" src="__LOGO__" data-in="27.2" data-ty="30">
    <div class="cta" data-in="27.5">APPLY <span class="red">NOW</span></div>
    <div class="subar ar" data-in="27.7" style="color:var(--red)">قدّم دلوقتي 👇</div>
    <div class="handle" data-in="28.0">💬 WhatsApp · <b>beast-coaching.onrender.com</b></div>
  </div>

  <div class="cap" id="cap"></div>
</div>

<script>
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function ease(x){return 1-Math.pow(1-x,3);}
var scenes=[].slice.call(document.querySelectorAll('.scene'));
var items=[].slice.call(document.querySelectorAll('[data-in]'));
window.seek=function(t){
  scenes.forEach(function(s){
    var a=+s.dataset.start,b=+s.dataset.end;
    var op=0;
    if(t>=a-0.01&&t<=b+0.01){
      var inn=clamp((t-a)/0.45,0,1), out=clamp((b-t)/0.4,0,1);
      op=Math.min(inn,out);
    }
    s.style.opacity=op;
    if(s.classList.contains('kb')){ var p=clamp((t-a)/(b-a),0,1); s.style.transform='scale('+(1.04+0.06*p).toFixed(4)+')'; }
  });
  items.forEach(function(el){
    var a=+el.dataset.in, dur=+(el.dataset.dur||0.7);
    var e=ease(clamp((t-a)/dur,0,1));
    if(el.dataset.grow!==undefined){ el.style.width=(e*(+el.dataset.grow))+'px'; el.style.opacity=1; return; }
    el.style.opacity=e;
    var ty=(el.dataset.ty!==undefined)?+el.dataset.ty:34;
    var extra='';
    if(el.dataset.kb){ var k=clamp((t-a)/4,0,1); extra=' scale('+(1.0+0.06*k).toFixed(4)+')'; }
    el.style.transform='translateY('+((1-e)*ty).toFixed(1)+'px)'+extra;
  });
};
window.seek(0);
</script>
</body></html>"""

HTML = HTML.replace("__ARFONT__", arfont).replace("__LOGO__", logo).replace("__PORTRAIT__", portrait)
HTML = (HTML.replace("__SHOT_CHOOSE__", shots["choose"]).replace("__SHOT_BOOK__", shots["book"])
            .replace("__SHOT_CHECKOUT__", shots["checkout"]).replace("__SHOT_PORTAL__", shots["portal"]))
with open(OUT, "w", encoding="utf-8") as f:
    f.write(HTML)
print("wrote", OUT, "(", len(HTML)//1024, "KB )")
