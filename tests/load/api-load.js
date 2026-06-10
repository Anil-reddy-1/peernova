import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 min
    { duration: '30s', target: 0 },  // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = 'http://localhost:4000/api/v1';

export default function () {
  // 1. Health check
  const healthRes = http.get('http://localhost:4000/health');
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Since most endpoints are authenticated, we simulate reading public tutors or 
  // auth would need to be mocked/provided via environment variables.
  
  sleep(1);
}
