import { catalogRouteResolver } from './core/showroom/showroom-route.resolvers';
import { routes } from './app.routes';

describe('app routes', () => {
  const shellChildren = routes[0]?.children ?? [];

  it('wires public catalog routes to scoped resolvers', () => {
    const usedCars = shellChildren.find((route) => route.path === 'used-cars');
    const newCars = shellChildren.find((route) => route.path === 'new-cars');

    expect(usedCars?.data?.['vehicleConditionScope']).toBe('used');
    expect(newCars?.data?.['vehicleConditionScope']).toBe('new');
    expect(usedCars?.resolve?.['catalogData']).toBe(catalogRouteResolver);
    expect(newCars?.resolve?.['catalogData']).toBe(catalogRouteResolver);
    expect(usedCars?.runGuardsAndResolvers).toBe('paramsOrQueryParamsChange');
    expect(newCars?.runGuardsAndResolvers).toBe('paramsOrQueryParamsChange');
  });
});
