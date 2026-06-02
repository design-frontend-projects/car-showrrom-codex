export class ShowroomHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(code);
  }
}

export function isShowroomHttpError(error: unknown): error is ShowroomHttpError {
  return error instanceof ShowroomHttpError;
}

export function mapShowroomError(error: unknown): ShowroomHttpError {
  if (isShowroomHttpError(error)) {
    return error;
  }

  if (isActiveListingLimitError(error)) {
    return new ShowroomHttpError(400, 'showroom.error.activeListingLimit', {
      status: 'showroom.error.activeListingLimit',
    });
  }

  return new ShowroomHttpError(500, 'showroom.error.unexpected');
}

function isActiveListingLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const meta =
    'meta' in error && typeof error.meta === 'object' && error.meta !== null
      ? JSON.stringify(error.meta)
      : '';

  return (
    message.includes('showroom.error.activeListingLimit') ||
    message.includes('car_listings_active_limit_per_client') ||
    meta.includes('car_listings_active_limit_per_client')
  );
}
