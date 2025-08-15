import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'exam_prep_chapters_v2';
const saveChapters = (c) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
const loadChapters = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };

function parseTextToQA(text) {
  if (!text) return [];
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const qas = []; let current = null;
  const optionRegex = /^\(?([A-Dઅ-દ])\)?\.?\s+(.+)$/i;
  const questionStartRegex = /^(?:\d+\.|Q\d*\)|Q\d*\.|પ્રશ્ન\s*\d*[:.)]?|Question\s*\d*[:.)]?)\s*(.+)$/i;
  const answerLineRegex = /^(?:Answer|Ans|Correct|જવાબ|સાચો)\s*[:\-\s]*([A-D])$/i;

  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    const ansMatch = line.match(answerLineRegex);
    if (ansMatch && current) { current.answer = ansMatch[1].toUpperCase(); continue; }
    const opt = line.match(optionRegex);
    if (opt && current) {
      const mapG = { 'અ':'A','બ':'B','ક':'C','દ':'D' };
      const key = String(opt[1]).toUpperCase();
      const norm = mapG[key] || key;
      current.options[norm] = (current.options[norm] ? current.options[norm] + ' ' : '') + opt[2].trim();
      continue;
    }
    const qMatch = line.match(questionStartRegex);
    if (qMatch) { if (current) qas.push(current); current = { id: uuidv4(), question: qMatch[1].trim(), options: {}, answer: null }; continue; }
    if (current) current.question += ' ' + line;
  }
  if (current) qas.push(current);
  return qas.map(q => ({ id: q.id, question: q.question, options: ['A','B','C','D'].map(k => ({ key:k, text:q.options[k]||'' })), answer: q.answer }));
}

export default function App() {
  const [chapters, setChapters] = useState(() => loadChapters());
  const [view, setView] = useState('home');
  const [selectedChapterIds, setSelected] = useState([]);
  const [testQ, setTestQ] = useState([]); const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0); const [ans, setAns] = useState(null);
  const [reqCount, setReqCount] = useState(10);

  useEffect(() => saveChapters(chapters), [chapters]);

  const loadDemo = () => {
    const gu = `1. ભારતની રાજધાની ક્યા શહેર છે?
A. મુંબઈ
B. દિલ્હી
C. ચેન્નઈ
D. કોલકાતા
Answer: B

2. ગુજરાતનું રાજભાષા શું છે?
A. ગુજરાતી
B. હિન્દી
C. અંગ્રેજી
D. સંસ્કૃત
Answer: A`;
    const en = `1. What is 2 + 3?
A. 4
B. 5
C. 6
D. 7
Answer: B

2. Capital of Japan?
A. Kyoto
B. Osaka
C. Tokyo
D. Nagoya
Answer: C`;
    const gqas = parseTextToQA(gu), eqas = parseTextToQA(en);
    const c1 = { id: uuidv4(), title: 'Gujarati Demo', qas: gqas };
    const c2 = { id: uuidv4(), title: 'English Demo', qas: eqas };
    setChapters([c1, c2]); alert('ડેમો ડેટા લોડ થયું');
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files||[]);
    for (const f of files) {
      try {
        const text = await f.text();
        const qas = parseTextToQA(text);
        setChapters(s => [...s, { id: uuidv4(), title: f.name, qas }]);
      } catch(err) { alert('ફાઇલ વાંચવામાં સમસ્યા: '+err); }
    }
    setView('home');
  };

  const shuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } };
  const startSingle = id => { const ch=chapters.find(c=>c.id===id); if(!ch) return; const pool=ch.qas.slice(); shuffle(pool); setTestQ(pool); setIdx(0); setScore(0); setAns(null); setView('test'); };
  const startMulti = (ids,total=null) => { let pool=[]; ids.forEach(id=>{ const ch=chapters.find(c=>c.id===id); if(ch) pool.push(...ch.qas); }); shuffle(pool); if(total && total<pool.length) pool=pool.slice(0,total); setTestQ(pool); setIdx(0); setScore(0); setAns(null); setView('test'); };
  const pick = (qa,k) => { if(ans && ans.id===qa.id) return; const ok=qa.answer? qa.answer.toUpperCase()===k.toUpperCase(): false; setScore(s=>s+(ok?1:0)); setAns({id:qa.id,selected:k,correct:qa.answer||null}); };
  const next = () => { if(!ans){ alert('કૃપા કરીને વિકલ્પ પસંદ કરો'); return; } setAns(null); if(idx+1>=testQ.length) setView('result'); else setIdx(i=>i+1); };

  if (view==='home') return (
    <div className="container">
      <h2>Exam Prep — હોમ</h2>
      <div className="grid">
        <button onClick={()=>document.getElementById('fileInput').click()}>1. તમારો Word/PDF અહીં મૂકો</button>
        <button onClick={()=>setView('single')}>2. વિષય મુજબ ટેસ્ટ</button>
        <button onClick={()=>setView('multi')}>3. એકથી વધુ વિષય</button>
        <button onClick={()=>setView('custom')}>4. કસ્ટમ ટેસ્ટ</button>
      </div>
      <input id="fileInput" type="file" multiple onChange={onFiles} style={{display:'none'}} />
      <div style={{marginTop:8}}>
        <button onClick={loadDemo}>ડેમો લોડ કરો</button>
        <button style={{marginLeft:8}} onClick={()=>{localStorage.removeItem(STORAGE_KEY); setChapters([]); alert('ચેપ્ટર્સ સાફ થયા');}}>સાફ કરો</button>
      </div>
      <div style={{marginTop:8}}>કુલ ચેપ્ટર્સ: {chapters.length}</div>
    </div>
  );

  if (view==='single') return (
    <div className="container">
      <h3>વિષય મુજબ ટેસ્ટ</h3>
      {chapters.map(c=>(
        <div className="card" key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontWeight:700}}>{c.title}</div><div style={{fontSize:12,color:'#666'}}>{c.qas.length} પ્રશ્ન</div></div>
          <button onClick={()=>startSingle(c.id)}>શરુ કરો</button>
        </div>
      ))}
      {chapters.length===0 && <div>કોઈ ચેપ્ટર નથી.</div>}
      <button onClick={()=>setView('home')}>પાછા</button>
    </div>
  );

  if (view==='multi' || view==='custom') return (
    <div className="container">
      <h3>{view==='multi' ? 'એકથી વધુ વિષય' : 'કસ્ટમ ટેસ્ટ'}</h3>
      {chapters.map(c=>(
        <label className="card" key={c.id}>
          <input type="checkbox" onChange={()=>setSelected(s=>s.includes(c.id)?s.filter(x=>x!==c.id):[...s,c.id])} checked={selectedChapterIds.includes(c.id)} />
          <span style={{marginLeft:8,fontWeight:700}}>{c.title}</span>
          <div style={{fontSize:12,color:'#666'}}>{c.qas.length} પ્રશ્ન</div>
        </label>
      ))}
      {view==='custom' && <div style={{marginTop:6}}>કુલ પ્રશ્નો: <input type="number" value={reqCount} min={1} onChange={e=>setReqCount(parseInt(e.target.value||'0'))} style={{width:90}} /></div>}
      <div style={{marginTop:8}}>
        <button onClick={()=>{
          if(selectedChapterIds.length===0) return alert('કમ સે કમ એક વિષય પસંદ કરો');
          if(view==='custom' && (!reqCount || reqCount<=0)) return alert('માન્ય નંબર નાખો');
          startMulti(selectedChapterIds, view==='custom'?reqCount:null);
        }}>ટેસ્ટ શરુ</button>
        <button style={{marginLeft:8}} onClick={()=>setView('home')}>પાછા</button>
      </div>
    </div>
  );

  if (view==='test') {
    const qa = testQ[idx]; if(!qa) return <div className="container">લોડ થઈ રહ્યું છે...</div>;
    return (
      <div className="container">
        <div style={{display:'flex',justifyContent:'space-between'}}><div>પ્રશ્ન {idx+1}/{testQ.length}</div><div>સ્કોર: {score}</div></div>
        <div style={{marginTop:8,fontWeight:700}}>{qa.question}</div>
        <div style={{marginTop:6}}>
          {qa.options.map(o=>{
            const ok = qa.answer && qa.answer.toUpperCase()===o.key.toUpperCase();
            const sel = ans && ans.id===qa.id && ans.selected===o.key;
            const cls = ans && ans.id===qa.id ? (ok?'opt green':(sel?'opt red':'opt')) : 'opt';
            return <div className={cls} key={o.key} onClick={()=>pick(qa,o.key)}>{o.key}. {o.text}</div>
          })}
        </div>
        <div style={{marginTop:8}}>
          <button onCli
`
