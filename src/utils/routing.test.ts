import test from 'node:test';
import assert from 'node:assert';
import { buildRouteUrl } from './routing';

test('buildRouteUrl creates correct URLs for views', () => {
  assert.strictEqual(buildRouteUrl('home'), '/');
  assert.strictEqual(buildRouteUrl('browse'), '/browse');
  assert.strictEqual(buildRouteUrl('browse', 'Textbooks'), '/browse?category=Textbooks');
  assert.strictEqual(buildRouteUrl('browse', 'all'), '/browse');
  assert.strictEqual(buildRouteUrl('browse', undefined, 'prod-123'), '/browse/product/prod-123');
  assert.strictEqual(buildRouteUrl('browse', undefined, undefined, 'laptop'), '/browse?q=laptop');
  assert.strictEqual(buildRouteUrl('browse', 'Electronics', undefined, 'mouse'), '/browse?category=Electronics&q=mouse');
  assert.strictEqual(buildRouteUrl('my-listings'), '/my-listings');
  assert.strictEqual(buildRouteUrl('messages'), '/messages');
  assert.strictEqual(buildRouteUrl('saved'), '/saved');
  assert.strictEqual(buildRouteUrl('services'), '/services');
  assert.strictEqual(buildRouteUrl('graduating-sale'), '/graduating-sale');
  assert.strictEqual(buildRouteUrl('help'), '/help');
  assert.strictEqual(buildRouteUrl('guides'), '/guides');
  assert.strictEqual(buildRouteUrl('settings'), '/settings');
  assert.strictEqual(buildRouteUrl('admin'), '/admin');
});
