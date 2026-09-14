import { afterEach, mock } from 'bun:test';

afterEach(() => {
  localStorage.clear();
  mock.restore();
});
