import {NextRequest,NextResponse} from 'next/server';
import {ensureSubscribers} from '../../../../lib/subscribers';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database not configured'},{status:503});
 try{
  const sql=await ensureSubscribers();
  const rows=await sql`SELECT email,source,created_at FROM xnovah_subscribers ORDER BY created_at DESC LIMIT 10000`;
  if(req.nextUrl.searchParams.get('format')==='csv'){
   const escape=(v:string)=>'"'+v.replace(/"/g,'""')+'"';
   const csv='Email,Source,Signed up at (UTC)\r\n'+rows.map(r=>[r.email,r.source,new Date(r.created_at).toISOString()].map(x=>escape(String(x))).join(',')).join('\r\n');
   return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="xnovah-subscribers.csv"','Cache-Control':'no-store'}});
  }
  const counts=await sql`SELECT source,COUNT(*)::int AS count FROM xnovah_subscribers GROUP BY source`;
  return NextResponse.json({subscribers:rows,counts},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Subscriber dashboard error',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Unable to load subscribers'},{status:502})}
}
