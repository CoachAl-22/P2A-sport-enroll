import { describe, it, expect } from 'vitest';
import { EMPTY_MEDIA_CHOICES, validImagePermission, imagePermissionRecord } from './photo-video-choices';
describe('application image permission record',()=>{
  it('allows participation with no image permission granted',()=>{
    expect(validImagePermission(EMPTY_MEDIA_CHOICES)).toBe(true);
    expect(imagePermissionRecord(EMPTY_MEDIA_CHOICES)).toMatchObject({privateCoaching:false,website:false,social:false,athleteAgreement:'Coach must check before each recording or public use'});
  });
  it('does not accept a positive choice without a named parent/guardian or adult athlete',()=>{
    expect(validImagePermission({...EMPTY_MEDIA_CHOICES,website:true})).toBe(false);
    expect(validImagePermission({...EMPTY_MEDIA_CHOICES,website:true,decisionMaker:'parent-guardian',decisionMakerName:'   '})).toBe(false);
  });
  it('records private coaching separately from public uses',()=>{
    const value={...EMPTY_MEDIA_CHOICES,privateCoaching:true,decisionMaker:'parent-guardian',decisionMakerName:'Test Parent'};
    expect(validImagePermission(value)).toBe(true);
    expect(imagePermissionRecord(value)).toMatchObject({privateCoaching:true,website:false,social:false,decisionMakerName:'Test Parent',policyVersion:'2026-11-01'});
  });
  it('does not expand website-only permission to social media or private coaching',()=>{
    const value={...EMPTY_MEDIA_CHOICES,website:true,decisionMaker:'adult-athlete',decisionMakerName:'Test Adult'};
    expect(validImagePermission(value)).toBe(true);
    expect(imagePermissionRecord(value)).toMatchObject({privateCoaching:false,website:true,social:false});
  });
});
