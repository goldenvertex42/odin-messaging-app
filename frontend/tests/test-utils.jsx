import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

/**
 * Enhanced renderWithRouter utility supporting dynamic component injection
 * @param {React.ReactElement} ui - The primary component under test
 * @param {Object} options - Custom configuration overrides
 */
export function renderWithRouter(ui, { 
  route = '/', 
  path = route, 
  loaderData = null, 
  action = null,
  // Pass an optional array of custom route definitions to override the defaults
  customRoutes = null 
} = {}) {

  // Default routes fallback when you want to assert on full page redirection realities
  const defaultRoutes = [
    { 
      path: path, 
      Component: () => ui, 
      loader: () => loaderData, 
      action: action, 
      HydrateFallback: () => <div data-testid="router-sync">Syncing context state...</div> 
    },
    { 
      path: "/conversations", 
      Component: () => <div data-testid="conversations-dashboard">Conversations Dashboard Page</div> 
    },
    { 
      path: "/login", 
      Component: () => <div data-testid="login-view">Login Page Form View</div> 
    },
    { 
      path: "/register", 
      Component: () => <div data-testid="register-view">Register Page Form View</div> 
    }
  ];

  // If a test passes specific routes (e.g. real components), use those instead
  const routesToMount = customRoutes || defaultRoutes;
  const Stub = createRoutesStub(routesToMount);

  return render(<Stub initialEntries={[route]} />);
}
