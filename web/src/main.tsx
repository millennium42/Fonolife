import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
type User={name:string;email:string;role:'admin'|'operator'};

function App(){
  const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[page,setPage]=useState('Início');
  useEffect(()=>{fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(x=>setUser(x?.user??null)).finally(()=>setLoading(false));},[]);
  async function login(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError('');const data=Object.fromEntries(new FormData(event.currentTarget));const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const body=await response.json();if(!response.ok)return setError(body.title);setUser(body.user);}
  async function logout(){await fetch('/api/auth/logout',{method:'POST'});setUser(null);}
  if(loading)return <main className="center" aria-live="polite">Carregando…</main>;
  if(!user)return <main className="login"><section><span className="brand">Fonolife</span><h1>Entre para cuidar dos seus pacientes</h1><p>Use seu e-mail e senha de acesso.</p><form onSubmit={login}><label>E-mail<input name="email" type="email" autoComplete="username" required autoFocus/></label><label>Senha<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label>{error&&<p className="error" role="alert">{error}</p>}<button>Entrar</button></form><details><summary>Contas da demonstração</summary><p>Admin: admin@demo.local / admin123<br/>Operador: operador@demo.local / operador123</p></details></section></main>;
  const pages=['Início','Pacientes','Acompanhamento','Financeiro'];
  return <div className="shell"><header><span className="brand">Fonolife</span><div><span>{user.name}</span><button className="link" onClick={logout}>Sair</button></div></header><nav aria-label="Principal">{pages.map(item=><button className={page===item?'active':''} onClick={()=>setPage(item)} key={item}>{item}</button>)}</nav><main><div className="title"><div><h1>{page}</h1><p>{page==='Início'?'O que precisa da sua atenção hoje.':'Esta área será entregue na próxima etapa.'}</p></div>{user.role==='admin'&&<button onClick={()=>setPage('Configurações')}>Configurações</button>}</div><section className="empty"><h2>{page==='Início'?'Tudo pronto para começar':'Nenhum registro por aqui'}</h2><p>{page==='Início'?'Use Pacientes para iniciar o atendimento quando o CRM estiver disponível.':'Os dados aparecerão aqui assim que forem cadastrados.'}</p></section></main></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
