const API_URL = import.meta.env.VITE_API_URL || "http://localhostL:8000" ;

export type Ping = {ok:boolean; service:string; message:string};

export async function getPing(): Promise<Ping> {
    const res = await fetch(`${API_URL}/api/ping`);
    if (!res.ok) throw new Error(`Ping failed: ${res.status}`);
    return res.json()
    
}

