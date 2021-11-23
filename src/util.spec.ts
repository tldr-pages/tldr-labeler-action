import {LabelType} from './labeler';
import {uniq} from './util';

describe('uniq', () => {
  it('should return an array with unique values', () => {
    const unique = uniq([LabelType.newCommand, LabelType.newCommand, LabelType.translation]);
    expect(unique).toEqual([LabelType.newCommand, LabelType.translation]);
  });
});
