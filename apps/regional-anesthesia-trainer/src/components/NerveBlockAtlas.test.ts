import{describe,expect,it}from'vitest';
import{NERVE_BLOCKS}from'./NerveBlockAtlas';

const atlasV2Ready=['adductor','femoral','interscalene','supraclavicular','axillary','popliteal'];

describe('Nervenblock-Atlas v2',()=>{
 it('keeps unique stable block ids',()=>{const ids=NERVE_BLOCKS.map(block=>block.id);expect(new Set(ids).size).toBe(ids.length);expect(ids.length).toBeGreaterThanOrEqual(10)});
 it('ships six complete block-specific visual reference sets',()=>{for(const id of atlasV2Ready){const block=NERVE_BLOCKS.find(item=>item.id===id);expect(block?.status).toBe('ready');expect(block?.visual).toBe(id);expect(block?.sono.length).toBeGreaterThanOrEqual(3);expect(block?.orientation.length).toBeGreaterThanOrEqual(3)}});
 it('keeps unfinished trunk blocks explicitly planned',()=>{for(const id of ['pecs2','esp','tap','rectus']){const block=NERVE_BLOCKS.find(item=>item.id===id);expect(block?.status).toBe('planned');expect(block?.visual).toBeUndefined()}});
 it('covers upper extremity, lower extremity and trunk categories',()=>{const regions=new Set(NERVE_BLOCKS.map(block=>block.region));expect(regions).toEqual(new Set(['Obere Extremität','Untere Extremität','Rumpf']))});
});
