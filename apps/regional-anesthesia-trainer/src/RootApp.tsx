import React,{useState}from'react';
import App from'./App';
import{NerveBlockAtlas}from'./components/NerveBlockAtlas';
import'./rootApp.css';

type View='simulator'|'atlas';
export default function RootApp(){
 const[view,setView]=useState<View>('simulator');
 if(view==='atlas')return <NerveBlockAtlas onOpenSimulator={()=>setView('simulator')}/>;
 return <div className="root-app-shell"><nav className="root-mode-tabs" aria-label="Hauptbereiche"><button className="active" aria-current="page">Simulation</button><button onClick={()=>setView('atlas')}>Nervenblock-Atlas</button></nav><App/></div>;
}
