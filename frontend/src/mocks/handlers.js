import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3000/api';

export const handlers = [
  // 1. Stateless Profile Gatekeeper
  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    // Emulate basic production validation: reject if the Bearer header is missing
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized. Token missing.' }, { status: 401 });
    }

    return HttpResponse.json({
      id: 'uuid-session-user',
      username: 'odin_user',
      email: 'me@odin.com',
      displayName: 'Odin User',
      avatarUrl: null,
      bio: 'Coding in Valhalla',
      isOnline: true
    }, { status: 200 });
  }),

  // 2. Authentication Login Handler
  http.post(`${API_URL}/auth/login`, async () => {
    // CRITICAL FIX: Injects a mock token string to match the refactored auth.controller
    return HttpResponse.json({
      message: 'Logged in successfully.',
      token: 'mock-valid-jwt-string-from-msw',
      user: {
        id: 'uuid-session-user',
        username: 'odin_user',
        email: 'me@odin.com',
        displayName: 'Odin User',
        avatarUrl: null,
        bio: 'Coding in Valhalla',
        isOnline: true
      }
    }, { status: 200 });
  }),

  // 3. Conversations Sync Endpoint
  http.get(`${API_URL}/conversations`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'chat-uuid-1',
          isGroup: false,
          updatedAt: new Date().toISOString(),
          participants: [
            { user: { id: 'uuid-session-user', displayName: 'Odin User', avatarUrl: null, isOnline: true } },
            { user: { id: 'other-user', displayName: 'Thor', avatarUrl: null, isOnline: false } }
          ],
          messages: [{ id: 'msg-1', content: 'Skål!', createdAt: new Date().toISOString() }]
        }
      ]
    }, { status: 200 });
  })
];
