import{describe,expect,it}from'vitest';
import{NERVE_BLOCKS}from'./NerveBlockAtlas';

describe('Nervenblock-Atlas v1',()=>{
 it('keeps unique stable block ids',()=>{const ids=NERVE_BLOCKS.map(block=>block.id);expect(new Set(ids).size).toBe(ids.length);expect(ids.length).toBeGreaterThanOrEqual(10)});
 it('ships the adductor canal as the first complete reference',()=>{const block=NERVE_BLOCKS.find(item=>item.id==='adductor');expect(block?.status).toBe('ready');expect(block?.target).toContain('N. saphenus');expect(block?.sono.length).toBeGreaterThanOrEqual(3);expect(block?.orientation.length).toBeGreaterThanOrEqual(3)});
 it('covers upper extremity, lower extremity and trunk categories',()=>{const regions=new Set(NERVE_BLOCKS.map(block=>block.region));expect(regions).toEqual(new Set(['Obere Extremität','Untere Extremität','Rumpf']))});
});
