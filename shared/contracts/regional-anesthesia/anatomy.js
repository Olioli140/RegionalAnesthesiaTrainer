export const STRUCTURE_TYPE = Object.freeze({
  SKIN:'skin', FAT:'fat', FASCIA:'fascia', MUSCLE:'muscle', ARTERY:'artery', VEIN:'vein',
  NERVE:'nerve', BONE:'bone', OTHER:'other'
});

export function validateAnatomicalStructure(structure){
  if(!structure || typeof structure!=='object') throw new TypeError('AnatomicalStructure must be an object');
  if(typeof structure.id!=='string' || !structure.id) throw new TypeError('AnatomicalStructure.id is required');
  if(typeof structure.displayName!=='string' || !structure.displayName) throw new TypeError('AnatomicalStructure.displayName is required');
  if(!Object.values(STRUCTURE_TYPE).includes(structure.type)) throw new TypeError(`Unsupported anatomical structure type: ${structure.type}`);
  if(typeof structure.geometryId!=='string' || !structure.geometryId) throw new TypeError('AnatomicalStructure.geometryId is required');
  if(!structure.transform || !structure.transform.positionMm || !structure.transform.orientation) throw new TypeError('AnatomicalStructure.transform is required');
  return structure;
}
