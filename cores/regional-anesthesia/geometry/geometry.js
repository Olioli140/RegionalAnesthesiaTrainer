export function vec3(x=0,y=0,z=0){ return {x,y,z}; }
export function add(a,b){ return vec3(a.x+b.x,a.y+b.y,a.z+b.z); }
export function sub(a,b){ return vec3(a.x-b.x,a.y-b.y,a.z-b.z); }
export function scale(v,s){ return vec3(v.x*s,v.y*s,v.z*s); }
export function dot(a,b){ return a.x*b.x+a.y*b.y+a.z*b.z; }
export function cross(a,b){ return vec3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x); }
export function length(v){ return Math.hypot(v.x,v.y,v.z); }
export function normalize(v){ const l=length(v); if(l===0) throw new RangeError('Cannot normalize zero vector'); return scale(v,1/l); }

export function quat(w=1,x=0,y=0,z=0){ return {w,x,y,z}; }
export function normalizeQuat(q){ const l=Math.hypot(q.w,q.x,q.y,q.z); if(l===0) throw new RangeError('Cannot normalize zero quaternion'); return {w:q.w/l,x:q.x/l,y:q.y/l,z:q.z/l}; }
export function quatMultiply(a,b){ return normalizeQuat({
  w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,
  x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
  y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
  z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w
}); }
export function quatFromAxisAngle(axis,rad){ const n=normalize(axis); const h=rad/2, s=Math.sin(h); return normalizeQuat({w:Math.cos(h),x:n.x*s,y:n.y*s,z:n.z*s}); }
export function rotateVector(q,v){
  const n=normalizeQuat(q); const p={w:0,x:v.x,y:v.y,z:v.z};
  const conj={w:n.w,x:-n.x,y:-n.y,z:-n.z};
  const rawMul=(a,b)=>({w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w});
  const r=rawMul(rawMul(n,p),conj); return vec3(r.x,r.y,r.z);
}
export function almostEqual(a,b,eps=1e-9){ return Math.abs(a-b)<=eps; }
export function vecAlmostEqual(a,b,eps=1e-9){ return almostEqual(a.x,b.x,eps)&&almostEqual(a.y,b.y,eps)&&almostEqual(a.z,b.z,eps); }
