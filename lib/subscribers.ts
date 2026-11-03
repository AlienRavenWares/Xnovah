import postgres from 'postgres';
let client:ReturnType<typeof postgres>|undefined;
export function db(){
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error('DATABASE_URL is not configured');
 if(!client)client=postgres(url,{max:3,connect_timeout:10,ssl:'require'});
 return client;
}
export async function ensureSubscribers(){
 const sql=db();
 await sql`CREATE TABLE IF NOT EXISTS xnovah_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Waitlist','Newsletter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email,source)
 )`;
 return sql;
}
