import { mapShowroomError, ShowroomHttpError } from './errors';

describe('showroom error mapping', () => {
  it('preserves stable showroom HTTP errors', () => {
    const error = new ShowroomHttpError(403, 'showroom.error.accessDenied');

    expect(mapShowroomError(error)).toBe(error);
  });

  it('maps active listing trigger failures to localized validation codes', () => {
    const error = mapShowroomError({
      message: 'constraint car_listings_active_limit_per_client failed',
    });

    expect(error.status).toBe(400);
    expect(error.code).toBe('showroom.error.activeListingLimit');
    expect(error.fieldErrors?.['status']).toBe('showroom.error.activeListingLimit');
  });
});
