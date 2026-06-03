import type { Express, NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { verifySessionCsrf } from '../auth/auth.service';
import { readCsrfCookie, readSessionCookie } from '../auth/cookie.service';
import { withRbacDatabaseContext } from '../rbac/db-context';
import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import { readPublicTenantId, requireShowroomContext } from './auth';
import { deleteStoredListingImage, listingImageUpload, serveListingImage, storeListingImageFile } from './upload.service';
import { isShowroomHttpError, mapShowroomError, ShowroomHttpError } from './errors';
import {
  addListingImage,
  createAdminVehicle,
  createListing,
  createVehicleDefinition,
  createVehicleRequest,
  deactivateVehicleDefinition,
  deleteListing,
  deleteListingImage,
  getAdminVehicle,
  getVehicleInventoryCounters,
  getPublicListing,
  listAdminVehicles,
  listAdminVehicleRequests,
  listUsersAndRoles,
  listVehicleDefinitions,
  listClientListings,
  listClientVehicleRequests,
  listMakes,
  listModels,
  listTaxonomy,
  listVariants,
  reorderListingImages,
  reviewVehicleRequest,
  searchListings,
  setPrimaryImage,
  transitionAdminVehicleStatus,
  transitionListingStatus,
  updateAdminVehicle,
  updateVehicleDefinition,
  updateListing,
} from './services';
import {
  adminVehicleInputSchema,
  adminVehicleQuerySchema,
  adminVehicleUpdateSchema,
  adminRequestQuerySchema,
  catalogDefinitionSchema,
  imageMetadataSchema,
  imageOrderSchema,
  listingInputSchema,
  listingStatusSchema,
  listingUpdateSchema,
  makeDefinitionSchema,
  modelDefinitionSchema,
  parseShowroomPayload,
  requestInputSchema,
  requestReviewSchema,
  searchQuerySchema,
  trimDefinitionSchema,
  usersRolesQuerySchema,
  vehicleDefinitionEntitySchema,
  vehicleDefinitionQuerySchema,
  type VehicleDefinitionEntity,
} from './validation';

type AsyncRoute = (request: Request, response: Response) => Promise<void>;

const mutationLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'showroom.error.rateLimited',
  },
});

export function registerShowroomRoutes(app: Express): void {
  const router = Router();

  router.get(
    '/taxonomy',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        listTaxonomy(tx, tenantId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/makes',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        listMakes(tx, tenantId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/models',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const makeId = typeof request.query['makeId'] === 'string' ? request.query['makeId'] : undefined;
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        listModels(tx, tenantId, makeId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/variants',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const modelId =
        typeof request.query['modelId'] === 'string' ? request.query['modelId'] : undefined;
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        listVariants(tx, tenantId, modelId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/listings',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const query = parseShowroomPayload(searchQuerySchema, request.query);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        searchListings(tx, tenantId, query),
      );

      response.json(result);
    }),
  );

  router.get(
    '/listings/:listingId',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        getPublicListing(tx, tenantId, listingId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/inventory-counters',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, (tx) =>
        getVehicleInventoryCounters(tx, tenantId),
      );

      response.json(result);
    }),
  );

  router.get(
    '/client/listings',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.listingManage);

        return listClientListings(tx, context);
      });

      response.json(result);
    }),
  );

  router.use(requireShowroomCsrf);

  router.post(
    '/client/listings',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const body = parseShowroomPayload(listingInputSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.listingManage);

        return createListing(tx, context, body);
      });

      response.status(201).json(result);
    }),
  );

  router.patch(
    '/client/listings/:listingId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(listingUpdateSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.listingManage);

        return updateListing(tx, context, listingId, body);
      });

      response.json(result);
    }),
  );

  router.post(
    '/client/listings/:listingId/status',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(listingStatusSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.listingManage);

        return transitionListingStatus(tx, context, listingId, body.status);
      });

      response.json(result);
    }),
  );

  router.delete(
    '/client/listings/:listingId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.listingManage);
        await deleteListing(tx, context, listingId);
      });

      response.status(204).end();
    }),
  );

  router.post(
    '/client/listings/:listingId/images',
    mutationLimiter,
    listingImageUpload.single('image'),
    handle(async (request, response) => {
      const file = request.file;

      if (!file) {
        throw new ShowroomHttpError(400, 'showroom.error.imageRequired', {
          image: 'showroom.error.imageRequired',
        });
      }

      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const metadata = parseShowroomPayload(imageMetadataSchema, request.body);
      const stored = await storeListingImageFile(file);

      try {
        const result = await withRbacDatabaseContext(
          { tenantId, bypassTenantIsolation: false },
          async (tx) => {
            const context = await requireShowroomContext(
              request,
              tx,
              SHOWROOM_PERMISSIONS.imageUpload,
            );

            return addListingImage(tx, context, listingId, stored, metadata);
          },
        );

        response.status(201).json(result);
      } catch (error) {
        await deleteStoredListingImage(stored.storageKey);
        throw error;
      }
    }),
  );

  router.patch(
    '/client/listings/:listingId/images/order',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(imageOrderSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.imageUpload);

        return reorderListingImages(tx, context, listingId, body.imageIds);
      });

      response.json(result);
    }),
  );

  router.post(
    '/client/listings/:listingId/images/:imageId/primary',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const imageId = requireParam(request, 'imageId');
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.imageUpload);

        return setPrimaryImage(tx, context, listingId, imageId);
      });

      response.json(result);
    }),
  );

  router.delete(
    '/client/listings/:listingId/images/:imageId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const imageId = requireParam(request, 'imageId');
      const storageKey = await withRbacDatabaseContext(
        { tenantId, bypassTenantIsolation: false },
        async (tx) => {
          const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.imageUpload);

          return deleteListingImage(tx, context, listingId, imageId);
        },
      );

      await deleteStoredListingImage(storageKey);
      response.status(204).end();
    }),
  );

  router.post(
    '/client/requests',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const body = parseShowroomPayload(requestInputSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.requestSubmit);

        return createVehicleRequest(tx, context, body);
      });

      response.status(201).json(result);
    }),
  );

  router.get(
    '/client/requests',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.requestSubmit);

        return listClientVehicleRequests(tx, context);
      });

      response.json(result);
    }),
  );

  router.get(
    '/admin/vehicles',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const query = parseShowroomPayload(adminVehicleQuerySchema, request.query);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return listAdminVehicles(tx, context, query);
      });

      response.json(result);
    }),
  );

  router.get(
    '/admin/users-roles',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const query = parseShowroomPayload(usersRolesQuerySchema, request.query);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return listUsersAndRoles(tx, context, query);
      });

      response.json(result);
    }),
  );

  router.get(
    '/admin/definitions/:entity',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const entity = readDefinitionEntity(request);
      const query = parseShowroomPayload(vehicleDefinitionQuerySchema, request.query);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return listVehicleDefinitions(tx, context, entity, query);
      });

      response.json(result);
    }),
  );

  router.post(
    '/admin/definitions/:entity',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const entity = readDefinitionEntity(request);
      const body = parseVehicleDefinitionBody(entity, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return createVehicleDefinition(tx, context, entity, body);
      });

      response.status(201).json(result);
    }),
  );

  router.patch(
    '/admin/definitions/:entity/:definitionId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const entity = readDefinitionEntity(request);
      const definitionId = requireParam(request, 'definitionId');
      const body = parseVehicleDefinitionBody(entity, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return updateVehicleDefinition(tx, context, entity, definitionId, body);
      });

      response.json(result);
    }),
  );

  router.delete(
    '/admin/definitions/:entity/:definitionId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const entity = readDefinitionEntity(request);
      const definitionId = requireParam(request, 'definitionId');
      await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);
        await deactivateVehicleDefinition(tx, context, entity, definitionId);
      });

      response.status(204).end();
    }),
  );

  router.get(
    '/admin/vehicles/:listingId',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return getAdminVehicle(tx, context, listingId);
      });

      response.json(result);
    }),
  );

  router.post(
    '/admin/vehicles',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const body = parseShowroomPayload(adminVehicleInputSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return createAdminVehicle(tx, context, body);
      });

      response.status(201).json(result);
    }),
  );

  router.patch(
    '/admin/vehicles/:listingId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(adminVehicleUpdateSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return updateAdminVehicle(tx, context, listingId, body);
      });

      response.json(result);
    }),
  );

  router.post(
    '/admin/vehicles/:listingId/status',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(listingStatusSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return transitionAdminVehicleStatus(tx, context, listingId, body.status);
      });

      response.json(result);
    }),
  );

  router.delete(
    '/admin/vehicles/:listingId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);
        await deleteListing(tx, context, listingId);
      });

      response.status(204).end();
    }),
  );

  router.post(
    '/admin/vehicles/:listingId/images',
    mutationLimiter,
    listingImageUpload.single('image'),
    handle(async (request, response) => {
      const file = request.file;

      if (!file) {
        throw new ShowroomHttpError(400, 'showroom.error.imageRequired', {
          image: 'showroom.error.imageRequired',
        });
      }

      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const metadata = parseShowroomPayload(imageMetadataSchema, request.body);
      const stored = await storeListingImageFile(file);

      try {
        const result = await withRbacDatabaseContext(
          { tenantId, bypassTenantIsolation: false },
          async (tx) => {
            const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

            return addListingImage(tx, context, listingId, stored, metadata);
          },
        );

        response.status(201).json(result);
      } catch (error) {
        await deleteStoredListingImage(stored.storageKey);
        throw error;
      }
    }),
  );

  router.patch(
    '/admin/vehicles/:listingId/images/order',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const body = parseShowroomPayload(imageOrderSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return reorderListingImages(tx, context, listingId, body.imageIds);
      });

      response.json(result);
    }),
  );

  router.post(
    '/admin/vehicles/:listingId/images/:imageId/primary',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const imageId = requireParam(request, 'imageId');
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

        return setPrimaryImage(tx, context, listingId, imageId);
      });

      response.json(result);
    }),
  );

  router.delete(
    '/admin/vehicles/:listingId/images/:imageId',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const listingId = requireParam(request, 'listingId');
      const imageId = requireParam(request, 'imageId');
      const storageKey = await withRbacDatabaseContext(
        { tenantId, bypassTenantIsolation: false },
        async (tx) => {
          const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.adminManage);

          return deleteListingImage(tx, context, listingId, imageId);
        },
      );

      await deleteStoredListingImage(storageKey);
      response.status(204).end();
    }),
  );

  router.get(
    '/admin/requests',
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const query = parseShowroomPayload(adminRequestQuerySchema, request.query);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.requestReview);

        return listAdminVehicleRequests(tx, context, query);
      });

      response.json(result);
    }),
  );

  router.post(
    '/admin/requests/:requestId/review',
    mutationLimiter,
    handle(async (request, response) => {
      const tenantId = readPublicTenantId(request);
      const requestId = requireParam(request, 'requestId');
      const body = parseShowroomPayload(requestReviewSchema, request.body);
      const result = await withRbacDatabaseContext({ tenantId, bypassTenantIsolation: false }, async (tx) => {
        const context = await requireShowroomContext(request, tx, SHOWROOM_PERMISSIONS.requestReview);

        return reviewVehicleRequest(tx, context, requestId, body);
      });

      response.json(result);
    }),
  );

  router.use(showroomErrorHandler);
  app.use('/api/showroom', router);
  app.get('/media/listings/:storageKey', handle(serveListingImage), showroomErrorHandler);
}

function handle(route: AsyncRoute) {
  return (request: Request, response: Response, next: NextFunction): void => {
    route(request, response).catch(next);
  };
}

function requireParam(request: Request, name: string): string {
  const value = request.params[name];

  if (!value || Array.isArray(value)) {
    throw new ShowroomHttpError(400, 'showroom.error.validation', {
      [name]: 'showroom.validation.required',
    });
  }

  return value;
}

function readDefinitionEntity(request: Request): VehicleDefinitionEntity {
  return parseShowroomPayload(vehicleDefinitionEntitySchema, requireParam(request, 'entity'));
}

function parseVehicleDefinitionBody(entity: VehicleDefinitionEntity, body: unknown) {
  switch (entity) {
    case 'makes':
      return parseShowroomPayload(makeDefinitionSchema, body);
    case 'models':
      return parseShowroomPayload(modelDefinitionSchema, body);
    case 'trims':
      return parseShowroomPayload(trimDefinitionSchema, body);
    case 'engines':
    case 'transmissions':
    case 'fuel-types':
    case 'body-types':
    case 'conditions':
      return parseShowroomPayload(catalogDefinitionSchema, body);
  }
}

async function requireShowroomCsrf(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
    next();
    return;
  }

  const headerToken = request.header('x-csrf-token');
  const cookieToken = readCsrfCookie(request);
  const token = headerToken && cookieToken && headerToken === cookieToken ? headerToken : null;
  const valid = await verifySessionCsrf(readSessionCookie(request), token);

  if (!valid) {
    next(new ShowroomHttpError(403, 'showroom.error.csrf'));
    return;
  }

  next();
}

function showroomErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (error instanceof multer.MulterError) {
    response.status(400).json({
      code: error.code === 'LIMIT_FILE_SIZE' ? 'showroom.error.imageTooLarge' : 'showroom.error.upload',
    });
    return;
  }

  if (isShowroomHttpError(error)) {
    response.status(error.status).json({
      code: error.code,
      fieldErrors: error.fieldErrors,
    });
    return;
  }

  const mappedError = mapShowroomError(error);

  if (mappedError.status === 500) {
    next(error);
    return;
  }

  response.status(mappedError.status).json({
    code: mappedError.code,
    fieldErrors: mappedError.fieldErrors,
  });
}
