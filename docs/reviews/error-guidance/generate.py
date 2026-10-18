from pathlib import Path
import json,base64,html
root=Path(__file__).resolve().parent
rows=json.loads((root/'scenarios.json').read_text())
esc=html.escape
hints=[
'Посчитай яблоки по одному. Отмечай каждое.',
'Соедини две группы. Посчитай все яблоки.',
'Убери 2 морковки. Посчитай оставшиеся.',
'Сначала заполни десяток. Разложи 5 на 2 и 3.',
'Сначала убери 3 до десятка. Затем убери ещё 2.',
'Уже есть 3. Сколько нужно добавить до 7?',
'Посчитай каждое выражение. Найди то, где получится 6.',
'Начни с 4. Сделай 2 шага по стрелке.',
'В десятке 10 единиц. Добавь ещё 7.',
'Собери группу из десяти. Сколько единиц останется?',
'Один длинный брусок — это десять. Добавь отдельные кубики.',
'У Капи 3 яблока. Он получил ещё 2. Соедини группы.',
'Было 5 яблок. Капи отдал 2. Сколько осталось?',
'Разложи числа на десятки и единицы. Сложи части.',
'Разменяй один десяток на 10 единиц: 42 — это 30 и 12.',
'Три одинаковые группы. В каждой по 4 яблока. Сложи группы.',
'23 — это 20 и 3. Умножь каждую часть на 4.',
'Разложи 12 яблок поровну в 3 корзинки.',
'84 — это 80 и 4. Раздели каждую часть на 4.',
'Части одинаковые: пятые. Сложи числители, знаменатель оставь.',
'Части одинаковые: пятые. Из четырёх частей убери одну.',
'Раздели на одинаковые части: половина — это две четверти.',
'Половина — это две четверти. Убери их из трёх четвертей.',
'Возьми половину одной трети. Раздели прямоугольник на 2 ряда и 3 столбца.',
'Сколько четвертей помещается в половине?',
'Запиши 1,2 как 1,20. Поставь запятые друг под другом.',
'Запиши 2,4 как 2,40. Выровняй запятые. Размени разряды.',
'Сначала умножь 12 на 3. В исходных числах вместе 2 знака после запятой.',
'Умножь оба числа на 10. Тогда делитель станет целым.',
'Соедини фишки в пары: +1 и −1 вместе дают 0.',
'Вычесть 5 — значит прибавить пять фишек −1. Убери нулевые пары.',
'Одинаковые знаки дают плюс. Затем умножь 3 на 2.',
'Разные знаки дают минус. Затем раздели 12 на 3.',
'Показатель 3 — это три одинаковых множителя. Не умножай основание на показатель.',
'Какое число при умножении на себя даёт 36?',
'Какое число трижды умноженное само на себя даёт 27?'
]
solutions=[
['1 → 2 → 3 → 4 → 5','Всего 5 яблок'],['3 + 2 = 5'],['5 − 2 = 3'],
['8 + 2 = 10','5 = 2 + 3','10 + 3 = 13'],['13 − 3 = 10','10 − 2 = 8'],
['7 − 3 = 4','3 + 4 = 7'],['2 + 4 = 6','2 + 3 = 5','3 + 4 = 7'],['4 → 3 → 2','4 − 2 = 2'],
['10 + 7 = 17'],['17 = 10 + 7','1 десяток и 7 единиц'],['10 + 4 = 14'],['3 + 2 = 5'],['5 − 2 = 3'],
['20 + 10 = 30','8 + 5 = 13','30 + 13 = 43'],['42 = 30 + 12','30 − 10 = 20','12 − 7 = 5','20 + 5 = 25'],
['4 + 4 + 4 = 12','3 × 4 = 12'],['20 × 4 = 80','3 × 4 = 12','80 + 12 = 92'],['12 : 3 = 4'],
['80 : 4 = 20','4 : 4 = 1','20 + 1 = 21'],['1/5 + 2/5 = 3/5'],['4/5 − 1/5 = 3/5'],
['1/2 = 2/4','2/4 + 1/4 = 3/4'],['1/2 = 2/4','3/4 − 2/4 = 1/4'],
['(1 × 1)/(2 × 3) = 1/6'],['1/2 × 4/1 = 2','В половине 2 четверти'],
['1,20 + 0,35 = 1,55'],['2,40 = 1 + 13/10 + 10/100','2,40 − 0,75 = 1,65'],
['12 × 3 = 36','36 : 100 = 0,36'],['1,2 : 0,3 = 12 : 3 = 4'],
['3 нулевые пары убраны','(−3) + 5 = 2'],['3 нулевые пары убраны','3 − 5 = −2'],
['− × − → +','3 × 2 = 6','(−3) × (−2) = 6'],['− : + → −','12 : 3 = 4','(−12) : 3 = −4'],
['3 × 3 = 9','9 × 3 = 27','3³ = 27'],['6 × 6 = 36','√36 = 6'],['3 × 3 × 3 = 27','∛27 = 3']]

def steps(items):return '<div class="steps">'+''.join('<div>'+esc(x)+'</div>' for x in items)+'</div>'
def fruit(n,carrot=False,numbered=False,removed=0):
 shape='<path d="M13 9 6 29 8 12Z" fill="#ed8936"/><path d="m12 10 1-7m0 7 6-5m-7 5-4-5" stroke="#39834c" stroke-width="3"/>' if carrot else '<path d="M16 10C3 3 1 18 9 28Q12 31 16 28Q20 31 24 26C31 13 25 4 16 10Z" fill="#df534a"/><path d="M16 10V4" stroke="#775339" stroke-width="2.5"/><path d="M17 7Q18 0 26 3Q24 9 17 7" fill="#39834c"/>'
 return '<div class="fruit">'+''.join('<span class="item'+(' removed' if i>=n-removed else '')+'"><svg viewBox="0 0 32 32">'+shape+'</svg>'+('<small>'+str(i+1)+'</small>' if numbered else '')+'</span>' for i in range(n))+'</div>'
def frame(n,removed=0):return '<div class="frames">'+''.join('<div class="frame">'+''.join('<i class="'+('filled ' if j<n else '')+('crossed' if n-removed<=j<n else '')+'"></i>' for j in range(a,a+10))+'</div>' for a in range(0,max(10,((n+9)//10)*10),10))+'</div>'
def groups(ns):return '<div class="groups">'+''.join('<div class="basket">'+fruit(n)+'</div>' for n in ns)+'</div>'
def parts(total,filled,removed=0):return '<div class="parts">'+''.join('<i class="'+('filled ' if i<filled else '')+('crossed' if filled-removed<=i<filled else '')+'"></i>' for i in range(total))+'</div>'
def blocks(tens,ones):return '<div class="blocks">'+''.join('<div class="ten">'+''.join('<i></i>' for _ in range(10))+'</div>' for _ in range(tens))+'<div class="ones">'+''.join('<i></i>' for _ in range(ones))+'</div></div>'
capy=base64.b64encode((root.parents[2]/'dist/assets/capybara.webp').read_bytes()).decode()
def line(solved):
 x=lambda n:20+n*36
 ticks=''.join(f'<path d="M{x(n)} 91v10"/><text x="{x(n)}" y="119">{n if solved or n!=2 else "?"}</text>' for n in range(11))
 arcs=''.join(f'<path class="arc" d="M{x(n)} 64 Q{x(n)-18} 27 {x(n-1)} 79"/><path class="arc" d="M{x(n-1)+2} 67 L{x(n-1)} 79 L{x(n-1)+12} 74"/>' for n in [4,3])
 return f'<svg class="numberline" viewBox="0 0 400 130"><path d="M20 95H380"/>{ticks}{arcs}<text x="128" y="24">2</text><image href="data:image/webp;base64,{capy}" x="{x(2 if solved else 4)-20}" y="42" width="40" height="50"/></svg>'
def signs(neg,pos,solved):
 rem=min(neg,pos) if solved else 0
 return '<div class="signs">'+''.join('<i class="neg '+('cancelled' if j<rem else '')+'">−1</i>' for j in range(neg))+''.join('<i class="pos '+('cancelled' if j<rem else '')+'">+1</i>' for j in range(pos))+'</div>'
def diagram(i,done):
 if i==1:return fruit(5,numbered=done)
 if i in [2,12]:return fruit(5,numbered=True) if done else groups([3,2])
 if i in [3,13]:return fruit(5,carrot=i==3,removed=2 if done else 0)
 if i==4:return frame(13) if done else frame(8)+fruit(5)
 if i==5:return frame(13,removed=5 if done else 0)
 if i==6:return '<div class="slots">'+''.join('<span>'+('●' if j<3 else ('●' if done else '?'))+'</span>' for j in range(7))+'</div>'
 if i==7:return steps(['2 + 4'+(' = 6 ✓' if done else ''),'2 + 3'+(' = 5' if done else ''),'3 + 4'+(' = 7' if done else '')])
 if i==8:return line(done)
 if i in [9,10]:return blocks(1,7)
 if i==11:return blocks(1,4)
 if i==14:return blocks(4,3) if done else steps(['28 = 20 + 8','15 = 10 + 5'])
 if i==15:return blocks(2,5) if done else blocks(3,12)
 if i==16:return groups([4,4,4])
 if i==17:return steps(['20 × 4'+(' = 80' if done else ' = ?'),'3 × 4'+(' = 12' if done else ' = ?')])
 if i==18:return groups([4,4,4]) if done else fruit(12)+groups([0,0,0])
 if i==19:return steps(['80 : 4'+(' = 20' if done else ' = ?'),'4 : 4'+(' = 1' if done else ' = ?')])
 if i==20:return parts(5,3) if done else parts(5,1)+parts(5,2)
 if i==21:return parts(5,4,1 if done else 0)
 if i==22:return parts(4,3) if done else parts(4,2)+parts(4,1)
 if i==23:return parts(4,3,2 if done else 0)
 if i==24:return '<div class="six-grid">'+''.join('<i class="'+('filled' if j==0 and done else 'guide')+'"></i>' for j in range(6))+'</div>'
 if i==25:return parts(4,2)
 if i in [26,27]:return '<div class="column">'+('1,20<br>+0,35' if i==26 else '2,40<br>−0,75')+'<hr>'+('1,55' if i==26 and done else '1,65' if done else '?,??')+'</div>'
 if i==28:return steps(['1,2 → 12','0,3 → 3','Два знака после запятой'])
 if i==29:return steps(['1,2 × 10 → 12','0,3 × 10 → 3'])
 if i==30:return signs(3,5,done)
 if i==31:return signs(5,3,done)
 if i==32:return steps(['− × − → +','3 × 2'+(' = 6' if done else ' = ?')])
 if i==33:return steps(['− : + → −','12 : 3'+(' = 4' if done else ' = ?')])
 if i==34:return steps(['3 × 3 × 3'+(' = 27' if done else ' = ?')])
 if i==35:return '<div class="square">'+''.join('<i></i>' for _ in range(36))+'</div>'+('<small>6 × 6 = 36</small>' if done else '')
 if i==36:return '<div class="layers">'+''.join('<div class="cube-layer">'+''.join('<i></i>' for _ in range(9))+'</div>' for _ in range(3))+'</div><small>'+('3 слоя по 3 × 3 = 27 кубиков' if done else '27 кубиков. Найди длину ребра.')+'</small>'
 return ''
css='''*{box-sizing:border-box}body{margin:0;background:#e5f8f1;color:#164740;font:16px/1.4 system-ui,sans-serif}header{padding:20px 30px;display:flex;align-items:center;gap:12px;max-width:1120px;margin:auto}header img{width:56px;height:56px}h1{font-size:24px;margin:0}header p{margin:2px 0;color:#54736c}nav{max-width:1060px;margin:0 auto 20px;display:flex;flex-wrap:wrap;gap:6px}nav a{background:white;border-radius:10px;padding:6px 12px;color:#12665a;text-decoration:none}.board{max-width:1060px;margin:0 auto 30px;padding:0 8px}h2{font-size:23px;margin:10px 0}.scenario{border-radius:18px;background:#fffdf7;padding:14px;margin:12px 0;border:1px solid #cce8de;break-inside:avoid}h3{font-size:19px;margin:0 0 10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{display:flex;flex-direction:column;border:1px solid #c6e3d8;border-radius:13px;overflow:hidden;background:white;padding:0 12px 12px;min-height:265px}.label{padding:7px 10px;margin:0 -12px 10px;background:#fff0b5;font-weight:750}.demo .label{background:#d9f3e7}.copy{margin:0 0 10px;font-size:16px;min-height:44px}.diagram{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;min-height:90px}.fruit{display:flex;justify-content:center;flex-wrap:wrap;gap:3px;max-width:360px}.item{position:relative;display:flex;flex-direction:column;align-items:center}.item svg{width:31px;height:33px}.item small{font-weight:bold}.removed{opacity:.4}.removed:after{content:"";position:absolute;left:0;top:15px;width:32px;height:3px;background:#ba6847;transform:rotate(-40deg)}button{margin-top:12px;background:#087b6c;color:white;border:0;border-radius:10px;font:700 15px system-ui;padding:9px 16px;align-self:flex-start;cursor:pointer}.panel button{margin-top:auto}.diagram{margin-bottom:12px}.steps{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px}.steps div{padding:6px 10px;background:#edf7f1;border-radius:7px;font-size:17px;font-weight:700}.solution{margin:10px 0}.frames{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.frame{display:grid;grid-template-columns:repeat(5,23px);gap:3px;border:1px solid #9dbcb0;padding:3px;border-radius:5px}.frame i,.parts i,.six-grid i{width:23px;height:23px;background:#f5f8f3;border:1px solid #9bbdb0;position:relative}.frame i.filled,.parts i.filled,.six-grid i.filled{background:#63bc98}.crossed:after{content:"";position:absolute;top:10px;left:0;width:22px;height:3px;transform:rotate(-40deg);background:#a65c42}.groups{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.basket{border:2px solid #cdb78e;background:#fff9e8;border-radius:8px 8px 20px 20px;min-height:40px;min-width:65px;padding:5px}.basket .fruit{max-width:130px}.basket .item svg{width:22px;height:25px}.slots{display:flex;gap:3px}.slots span{border:1px solid #8cb2a1;padding:3px 6px}.blocks{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;max-width:370px}.ten{display:flex}.ten i,.ones i{width:12px;height:16px;border:1px solid #639f81;background:#a4dcb7}.ones{display:flex;gap:3px;flex-wrap:wrap;max-width:110px}.parts{display:flex;gap:2px}.parts i{width:36px;height:25px}.six-grid{display:grid;grid-template-columns:repeat(3,46px)}.six-grid i{width:46px;height:35px}.six-grid .guide{background:#e3f2ec}.numberline{width:100%;max-width:430px;height:115px}.numberline path{stroke:#3b8d7e;stroke-width:2;fill:none}.numberline text{text-anchor:middle;font-size:14px;font-weight:700;fill:#25544c}.numberline .arc{stroke:#d2981d;stroke-width:3}.column{font:700 23px/1.25 monospace;text-align:right;letter-spacing:4px;padding:7px 12px;background:#edf7f1;border-radius:8px}.column hr{margin:4px 0}.signs{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:340px}.signs i{font-style:normal;border-radius:50%;width:33px;height:33px;display:grid;place-items:center;font-weight:700}.neg{background:#ffe3c7}.pos{background:#c6edd8}.cancelled{opacity:.35;text-decoration:line-through}.square{display:grid;grid-template-columns:repeat(6,15px);gap:2px}.square i{width:15px;height:15px;background:#6fbea0;border:1px solid #41886e}.layers{display:flex;gap:12px}.cube-layer{display:grid;grid-template-columns:repeat(3,17px);gap:2px;transform:skewY(-8deg)}.cube-layer i{width:17px;height:17px;background:#a4dcb7;border:1px solid #46896b}footer{max-width:1060px;margin:20px auto 40px;color:#54736c;font-size:14px}.selected{outline:3px solid #d3a520}@media(max-width:700px){.pair{grid-template-columns:1fr}header{padding:15px}h1{font-size:20px}nav{padding:0 10px}.board{padding:0 10px}h3{font-size:18px}.panel{min-height:245px}}'''
body=f'<header><img src="data:image/webp;base64,{capy}" alt="Капи"><div><h1>Подсказки и демонстрации · 36 сценариев</h1><p>Эскизы для обсуждения. Приложение не изменено.</p></div></header>'
body+='<nav>'+''.join(f'<a href="?board={i}">Лист {i}</a>' for i in range(1,10))+'<a href="?board=all">Все</a></nav>'
for board in range(9):
 body+=f'<section class="board" data-board="{board+1}"><h2>Лист {board+1} / 9</h2>'
 for j in range(board*4,board*4+4):
  i=j+1;r=rows[j];body+=f'<article class="scenario" id="case-{i}"><h3>{i:02d}. {esc(r[0])}</h3><div class="pair">'
  body+=f'<div class="panel"><div class="label">1-я ошибка · Попробуем вместе</div><p class="copy">{esc(hints[j])}</p><div class="diagram">{diagram(i,False)}</div><button type="button" onclick="preview({i})">Попробовать ещё</button></div>'
  body+=f'<div class="panel demo" id="demo-{i}"><div class="label">2-я ошибка · Смотрим вместе</div><div class="diagram">{diagram(i,True)}</div><div class="solution">{steps(solutions[j])}</div><button type="button" onclick="nextCase({i})">Дальше</button></div></div></article>'
 body+='</section>'
body+='<footer>Слева — способ решения без готового ответа. Справа — завершённая демонстрация. В приложении предлагается показывать эти состояния последовательно, а не рядом. Переход после демонстрации — по кнопке «Дальше». Это предложение, не опубликованный интерфейс. Кнопки в макете помогают просматривать карточки.</footer>'
script='''const selected=new URLSearchParams(location.search).get('board')||'all';document.querySelectorAll('[data-board]').forEach(e=>e.hidden=selected!=='all'&&e.dataset.board!==selected);function preview(i){document.querySelectorAll('.selected').forEach(e=>e.classList.remove('selected'));const e=document.getElementById('demo-'+i);e.classList.add('selected');e.scrollIntoView({behavior:'smooth',block:'center'});}function nextCase(i){const next=document.getElementById('case-'+(i+1));if(next&&!next.closest('[hidden]'))next.scrollIntoView({behavior:'smooth',block:'center'});else{const n=Math.min(9,Math.floor(i/4)+1);location.search='?board='+n;}}'''
(root/'index.html').write_text('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Капи — эскизы подсказок</title><style>'+css+'</style>'+body+'<script>'+script+'</script></html>')
assert len(rows)==len(hints)==len(solutions)==36
print('Built 36 pairs in 9 boards; no dist files changed')
