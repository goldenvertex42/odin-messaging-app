import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router'; // Modern unified core import

export function renderWithRouter(ui, { 
  route = '/', 
  path = route, 
  loaderData = null, 
  action 
} = {}) {
  const Stub = createRoutesStub([
    {
      path: path,
      Component: () => ui,
      loader: () => loaderData,
      action: action,
      HydrateFallback: () => <div>Syncing context state...</div>
    },
    { path: "/conversations", Component: () => <div>Conversations Dashboard Page</div> },
    { path: "/login", Component: () => <div>Login Page Form View</div> },
    { path: "/register", Component: () => <div>Register Page Form View</div> }
  ]);

  return render(<Stub initialEntries={[route]} />);
}
