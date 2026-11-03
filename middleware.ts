import {NextRequest,NextResponse} from 'next/server';
export function middleware(req:NextRequest){
 const user=process.env.XNOVAH_ADMIN_USER;
 const pass=process.env.XNOVAH_ADMIN_PASSWORD;
 const unauthorized=()=>new NextResponse('Admin access requires credentials.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Xnovah Subscribers", charset="UTF-8"','Cache-Control':'no-store'}});
 if(!user||!pass||pass.length<16)return new NextResponse('Admin dashboard is not configured.',{status:503,headers:{'Cache-Control':'no-store'}});
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Basic '))return unauthorized();
 let decoded='';
 try{decoded=atob(auth.slice(6))}catch{return unauthorized()}
 const separator=decoded.indexOf(':');
 if(separator<0)return unauthorized();
 const suppliedUser=decoded.slice(0,separator);
 const suppliedPass=decoded.slice(separator+1);
 const equals=(a:string,b:string)=>{const len=Math.max(a.length,b.length);let diff=a.length^b.length;for(let i=0;i<len;i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0};
 if(!equals(suppliedUser,user)||!equals(suppliedPass,pass))return unauthorized();
 return NextResponse.next();
}
export const config={matcher:['/admin/:path*','/api/admin/:path*']};
