'use client';
import {useEffect,useMemo,useState} from 'react';
type Subscriber={email:string;source:'Waitlist'|'Newsletter';created_at:string};
export default function SubscribersAdmin(){
 const [rows,setRows]=useState<Subscriber[]>([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState('All');
 const [search,setSearch]=useState('');
 useEffect(()=>{fetch('/api/admin/subscribers',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to load');setRows(d.subscribers||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 const visible=useMemo(()=>rows.filter(r=>(filter==='All'||r.source===filter)&&r.email.includes(search.trim().toLowerCase())),[rows,filter,search]);
 return <main style={{minHeight:'100vh',background:'#080b13',color:'#f5f6ff',fontFamily:'Arial,sans-serif',padding:'clamp(20px,5vw,64px)'}}>
 <div style={{maxWidth:1100,margin:'auto'}}>
 <a href="/" style={{color:'#aeb5cc',textDecoration:'none'}}>← Xnovah homepage</a>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginTop:35}}>
 <div><p style={{color:'#a8a1ff',letterSpacing:3,fontSize:12}}>XNOVAH / PRIVATE ADMIN</p><h1 style={{fontSize:'clamp(30px,5vw,48px)',margin:'10px 0'}}>Subscribers</h1><p style={{color:'#aeb5cc'}}>Track waitlist and newsletter signups separately.</p></div>
 <a href="/api/admin/subscribers?format=csv" style={{background:'#8e7bff',color:'#080b13',padding:'14px 20px',borderRadius:12,textDecoration:'none',fontWeight:700}}>Export CSV ↓</a>
 </div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,margin:'28px 0'}}>
 {[['Total signups',rows.length],['Waitlist',rows.filter(r=>r.source==='Waitlist').length],['Newsletter',rows.filter(r=>r.source==='Newsletter').length]].map(([name,value])=><div key={name} style={{background:'#141928',border:'1px solid #293049',borderRadius:16,padding:20}}><div style={{color:'#aeb5cc',fontSize:13}}>{name}</div><div style={{fontSize:34,fontWeight:700,marginTop:10}}>{value}</div></div>)}
 </div>
 <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
 <input aria-label="Search email" placeholder="Search email address" value={search} onChange={e=>setSearch(e.target.value)} style={{background:'#141928',border:'1px solid #38405a',color:'white',borderRadius:10,padding:'12px 16px',flex:'1 1 230px'}}/>
 <select aria-label="Filter signup source" value={filter} onChange={e=>setFilter(e.target.value)} style={{background:'#141928',border:'1px solid #38405a',color:'white',borderRadius:10,padding:'12px 16px'}}><option>All</option><option>Waitlist</option><option>Newsletter</option></select>
 </div>
 {loading?<p>Loading subscribers…</p>:error?<p role="alert" style={{color:'#ff9b9b'}}>{error}</p>:<div style={{overflowX:'auto',border:'1px solid #293049',borderRadius:16}}>
 <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',minWidth:580}}><thead><tr style={{background:'#171c2d'}}>{['Email','Source','Signed up (UTC)'].map(h=><th key={h} style={{padding:16}}>{h}</th>)}</tr></thead><tbody>{visible.map((r,i)=><tr key={r.email+r.source} style={{borderTop:'1px solid #293049'}}><td style={{padding:16}}>{r.email}</td><td style={{padding:16}}><span style={{background:r.source==='Waitlist'?'#30264f':'#173c39',color:r.source==='Waitlist'?'#d4bdff':'#a5eee0',padding:'7px 12px',borderRadius:100,fontSize:12,fontWeight:700}}>{r.source}</span></td><td style={{padding:16,color:'#aeb5cc'}}>{new Date(r.created_at).toLocaleString('en-GB',{timeZone:'UTC'})}</td></tr>)}</tbody></table>
 {visible.length===0&&<p style={{padding:20,color:'#aeb5cc'}}>No matching subscribers.</p>}</div>}
 <p style={{color:'#8b93a9',marginTop:18,fontSize:12}}>Showing up to 10,000 most recent records. Each email may appear once per source.</p>
 </div></main>
}
