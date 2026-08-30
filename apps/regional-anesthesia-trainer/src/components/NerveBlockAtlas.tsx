import React,{useMemo,useState}from'react';
import'./nerveBlockAtlas.css';

type AtlasBlock={id:string;name:string;region:'Obere Extremität'|'Untere Extremität'|'Rumpf';probe:'quer'|'längs'|'variabel';target:string;position:string;sono:string[];orientation:string[];tip:string;status:'ready'|'planned'};

export const NERVE_BLOCKS:ReadonlyArray<AtlasBlock>=Object.freeze([
 {id:'adductor',name:'Adduktorenkanal',region:'Untere Extremität',probe:'quer',target:'N. saphenus im Adduktorenkanal nahe der A. femoralis',position:'Rückenlage, Bein leicht außenrotiert und leicht gebeugt.',sono:['M. sartorius als Dach des Kanals','A. femoralis als Leitstruktur','N. saphenus meist lateral oder anterolateral der Arterie'],orientation:['Medialer mittlerer bis distaler Oberschenkel','Transversale Sondenlage','Langsam entlang des medialen Oberschenkels verschieben'],tip:'Nadelspitze neben dem N. saphenus im Adduktorenkanal.',status:'ready'},
 {id:'femoral',name:'Femoralblock',region:'Untere Extremität',probe:'quer',target:'N. femoralis lateral der A. femoralis',position:'Rückenlage, Leiste frei zugänglich.',sono:['A. femoralis identifizieren','N. femoralis lateral der Arterie','Fascia iliaca als echogene Grenzschicht'],orientation:['Sonde transversal in der Leistenfalte','Gefäß-Nerven-Beziehung beurteilen'],tip:'Unter der Fascia iliaca in unmittelbarer Nähe des N. femoralis.',status:'planned'},
 {id:'popliteal',name:'Poplitealer Ischiadicusblock',region:'Untere Extremität',probe:'quer',target:'N. tibialis und N. fibularis communis vor ihrer Vereinigung',position:'Bauch-, Seiten- oder Rückenlage je nach Zugang.',sono:['A. poplitea als tiefe Leitstruktur','N. tibialis und N. fibularis communis verfolgen','Teilung/Vereinigung dynamisch darstellen'],orientation:['Transversal in der Fossa poplitea','Nach proximal bis zur gemeinsamen Scheide verfolgen'],tip:'Perineural im Bereich der gemeinsamen Nervenscheide.',status:'planned'},
 {id:'interscalene',name:'Interskalenärblock',region:'Obere Extremität',probe:'quer',target:'Plexus brachialis zwischen M. scalenus anterior und medius',position:'Rückenlage, Kopf leicht zur Gegenseite gedreht.',sono:['M. scalenus anterior und medius','Plexuswurzelanteile als runde hypoechogene Strukturen','Gefäße vor Punktion identifizieren'],orientation:['Sonde lateral am Hals transversal','Plexus zwischen den Skalenusmuskeln zentrieren'],tip:'Zwischen den Plexusanteilen ohne intraneurale Lage.',status:'planned'},
 {id:'supraclavicular',name:'Supraklavikulärer Plexusblock',region:'Obere Extremität',probe:'quer',target:'Plexus brachialis lateral der A. subclavia',position:'Rückenlage, Kopf zur Gegenseite.',sono:['A. subclavia als Leitstruktur','Plexus als Bündel lateral/superfiziell der Arterie','Pleura und erste Rippe sicher erkennen'],orientation:['Sonde knapp kranial der Klavikula','Koronale schräge Ausrichtung'],tip:'Im Plexusbündel unter kontinuierlicher Spitzenkontrolle.',status:'planned'},
 {id:'axillary',name:'Axillärer Plexusblock',region:'Obere Extremität',probe:'quer',target:'Nn. medianus, ulnaris und radialis um die A. axillaris',position:'Rückenlage, Arm abduziert.',sono:['A. axillaris als Zentrum','Mehrere Nerven um die Arterie','Muskeln und Sehnen als Orientierung'],orientation:['Sonde transversal in der Axilla','Kompression zur Venendifferenzierung'],tip:'Selektiv perineural um die Zielnerven.',status:'planned'},
 {id:'pecs2',name:'PECS-II',region:'Rumpf',probe:'variabel',target:'Faszienräume zwischen M. pectoralis major/minor und M. serratus anterior',position:'Rückenlage, Arm leicht abduziert.',sono:['M. pectoralis major/minor','M. serratus anterior','Rippe und Pleura als tiefe Grenze'],orientation:['Anterolaterale Thoraxwand','Sonde parallel zur Rippenachse'],tip:'In den definierten interfaszialen Schichten.',status:'planned'},
 {id:'esp',name:'Erector-spinae-Plane-Block',region:'Rumpf',probe:'längs',target:'Faszienebene tief des M. erector spinae über dem Processus transversus',position:'Sitzend, Seiten- oder Bauchlage.',sono:['Processus transversus als knöcherne Landmarke','M. erector spinae superficial','Pleura weiter ventral/tief'],orientation:['Longitudinal parasagittal','Zielwirbelhöhe lokalisieren'],tip:'Zwischen M. erector spinae und Processus transversus.',status:'planned'},
 {id:'tap',name:'TAP-Block',region:'Rumpf',probe:'quer',target:'Transversus-abdominis-Plane zwischen M. obliquus internus und M. transversus abdominis',position:'Rückenlage.',sono:['Drei Muskelschichten der Bauchwand','Peritoneum als tiefe Grenze','Faszienebene zwischen IO und TA'],orientation:['Sonde transversal an der lateralen Bauchwand'],tip:'In die TAP-Faszienebene.',status:'planned'},
 {id:'rectus',name:'Rectus-Sheath-Block',region:'Rumpf',probe:'quer',target:'Hintere Rektusscheide',position:'Rückenlage.',sono:['M. rectus abdominis','Vordere und hintere Rektusscheide','Peritoneum tief'],orientation:['Sonde transversal paramedian'],tip:'Zwischen M. rectus und hinterer Rektusscheide.',status:'planned'}
]);

const usImage=new URL('../assets/atlas-adductor-ultrasound.jpg',import.meta.url).href;
const probeImage=new URL('../assets/atlas-adductor-probe.jpg',import.meta.url).href;

export function NerveBlockAtlas({onOpenSimulator}:{onOpenSimulator:()=>void}){
 const[query,setQuery]=useState('');
 const[region,setRegion]=useState<'Alle'|AtlasBlock['region']>('Alle');
 const[selectedId,setSelectedId]=useState('adductor');
 const selected=NERVE_BLOCKS.find(b=>b.id===selectedId)??NERVE_BLOCKS[0];
 const filtered=useMemo(()=>NERVE_BLOCKS.filter(b=>(region==='Alle'||b.region===region)&&(`${b.name} ${b.target}`.toLowerCase().includes(query.toLowerCase()))),[query,region]);
 return <main className="atlas-shell">
  <header className="atlas-topbar">
   <div><p className="eyebrow">Regional Anesthesia Trainer · A6.8</p><h1>Nervenblock-Atlas</h1><p className="subtitle">Ultraschallanatomie, Sondenposition und technische Orientierung.</p></div>
   <div className="atlas-actions"><button onClick={onOpenSimulator}>← Simulator</button><span className="atlas-online">● Atlas bereit</span></div>
  </header>
  <section className="atlas-layout">
   <aside className="atlas-nav panel">
    <div className="atlas-nav-title">Referenz</div>
    <button className="atlas-nav-item active">▣ Nervenblock-Atlas</button>
    <button className="atlas-nav-item" onClick={onOpenSimulator}>▶ Simulation</button>
    <div className="atlas-status"><strong>Atlas v1</strong><span>{NERVE_BLOCKS.length} Blocks angelegt</span><span>Adduktorenkanal: Bildset vollständig</span></div>
   </aside>
   <section className="atlas-list panel">
    <div className="atlas-list-head"><h2>Nervenblöcke</h2><span>{filtered.length}</span></div>
    <input className="atlas-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Block oder Struktur suchen…" />
    <select className="atlas-select" value={region} onChange={e=>setRegion(e.target.value as typeof region)}><option>Alle</option><option>Obere Extremität</option><option>Untere Extremität</option><option>Rumpf</option></select>
    <div className="atlas-block-list">{filtered.map(block=><button key={block.id} className={`atlas-block-card ${block.id===selected.id?'active':''}`} onClick={()=>setSelectedId(block.id)}>
      <span className="atlas-thumb">{block.status==='ready'?<img src={usImage} alt=""/>:<i>US</i>}</span>
      <span><strong>{block.name}</strong><small>{block.region} · Sonde {block.probe}</small><small>{block.status==='ready'?'Bildset verfügbar':'Bildset folgt'}</small></span>
    </button>)}</div>
   </section>
   <section className="atlas-detail">
    <div className="atlas-detail-head"><div><p className="eyebrow">{selected.region}</p><h2>{selected.name}</h2><p>{selected.target}</p></div><button className="primary" onClick={onOpenSimulator}>Zur Simulation</button></div>
    <div className="atlas-detail-grid">
     <article className="panel atlas-media-card"><div className="panel-heading"><div><p className="eyebrow">Ultraschallbild</p><h3>{selected.status==='ready'?'Referenzansicht':'Bildset in Vorbereitung'}</h3></div><span>Sonde {selected.probe}</span></div>
      {selected.status==='ready'?<img className="atlas-us-image" src={usImage} alt="Fotorealistische Ultraschall-Referenz des Adduktorenkanals"/>:<AtlasPlaceholder label={`${selected.name}: Ultraschallbild folgt`}/>} 
      <p className="atlas-caption">{selected.target}</p>
     </article>
     <article className="panel atlas-media-card"><div className="panel-heading"><div><p className="eyebrow">Sondenposition</p><h3>Körperposition und Orientierung</h3></div><span>{selected.position}</span></div>
      {selected.status==='ready'?<img className="atlas-probe-image" src={probeImage} alt="Sondenposition am medialen Oberschenkel"/>:<AtlasPlaceholder label={`${selected.name}: Sondenfoto folgt`}/>} 
      <p className="atlas-caption">{selected.position}</p>
     </article>
     <article className="panel atlas-info-card"><h3>Anatomische Orientierung</h3><ul>{selected.orientation.map(x=><li key={x}>{x}</li>)}</ul></article>
     <article className="panel atlas-info-card"><h3>Sono-Merkmale</h3><ul>{selected.sono.map(x=><li key={x}>{x}</li>)}</ul></article>
     <article className="panel atlas-info-card"><h3>Nadel-Tipp-Ziel</h3><p>{selected.tip}</p><div className="atlas-warning">Ausbildungsreferenz: anatomische Variationen und lokale Standards berücksichtigen.</div></article>
    </div>
    <footer className="atlas-footer">Educational / research engineering · kein Medizinprodukt · nicht für Patientenversorgung.</footer>
   </section>
  </section>
 </main>;
}

function AtlasPlaceholder({label}:{label:string}){return <div className="atlas-placeholder" role="img" aria-label={label}><div className="atlas-placeholder-us"/><strong>{label}</strong><span>Atlas v1 erweitert die Bildsets blockweise.</span></div>}
