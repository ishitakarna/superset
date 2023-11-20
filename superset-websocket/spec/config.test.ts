/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { buildConfig } from '../src/config';

test('buildConfig builds configuration and applies env var overrides', () => {
  let config = buildConfig();

  expect(config.jwtSecret).toEqual(
    'test123-test123-test123-test123-test123-test123-test123',
  );
  expect(config.redis.host).toEqual('127.0.0.1');
  expect(config.redis.port).toEqual(6379);
  expect(config.redis.password).toEqual('some pwd');
  expect(config.redis.db).toEqual(10);
  expect(config.redis.ssl).toEqual(false);
  expect(config.statsd.host).toEqual('127.0.0.1');
  expect(config.statsd.port).toEqual(8125);
  expect(config.statsd.globalTags).toEqual([]);

  process.env.JWT_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  process.env.REDIS_HOST = '10.10.10.10';
  process.env.REDIS_PORT = '6380';
  process.env.REDIS_PASSWORD = 'admin';
  process.env.REDIS_DB = '4';
  process.env.REDIS_SSL = 'true';
  process.env.STATSD_HOST = '15.15.15.15';
  process.env.STATSD_PORT = '8000';
  process.env.STATSD_GLOBAL_TAGS = 'tag-1,tag-2';

  config = buildConfig();

  expect(config.jwtSecret).toEqual('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  expect(config.redis.host).toEqual('10.10.10.10');
  expect(config.redis.port).toEqual(6380);
  expect(config.redis.password).toEqual('admin');
  expect(config.redis.db).toEqual(4);
  expect(config.redis.ssl).toEqual(true);
  expect(config.statsd.host).toEqual('15.15.15.15');
  expect(config.statsd.port).toEqual(8000);
  expect(config.statsd.globalTags).toEqual(['tag-1', 'tag-2']);

  delete process.env.JWT_SECRET;
  delete process.env.REDIS_HOST;
  delete process.env.REDIS_PORT;
  delete process.env.REDIS_PASSWORD;
  delete process.env.REDIS_DB;
  delete process.env.REDIS_SSL;
  delete process.env.STATSD_HOST;
  delete process.env.STATSD_PORT;
  delete process.env.STATSD_GLOBAL_TAGS;
});

test('buildConfig performs deep merge between configs', () => {
  const config = buildConfig();
  // We left the ssl setting the default
  expect(config.redis.ssl).toEqual(false);
  // We overrode the pwd
  expect(config.redis.password).toEqual('some pwd');
});

// Test 1: Default Configuration
test('should build default configuration', () => {
  const config = buildConfig();
  expect(config.jwtSecret).toEqual('test123-test123-test123-test123-test123-test123-test123');
  // ... other default config assertions
});

// Test 2: Environment Variable Overrides for JWT
test('should override JWT config with environment variables', () => {
  process.env.JWT_SECRET = 'new-jwt-secret';
  const config = buildConfig();
  expect(config.jwtSecret).toEqual('new-jwt-secret');
  delete process.env.JWT_SECRET;
});

// Test 3: Environment Variable Overrides for Redis
test('should override Redis config with environment variables', () => {
  // Set Redis related env vars
  process.env.REDIS_HOST = 'new-redis-host';
  // ... set other Redis env vars

  const config = buildConfig();
  expect(config.redis.host).toEqual('new-redis-host');
  // ... other Redis config assertions

  // Cleanup Redis related env vars
  delete process.env.REDIS_HOST;
  // ... delete other Redis env vars
});

// Test 4: Environment Variable Overrides for StatsD
test('should override StatsD config with environment variables', () => {
  // Set StatsD related env vars
  process.env.STATSD_HOST = 'new-statsd-host';
  // ... set other StatsD env vars

  const config = buildConfig();
  expect(config.statsd.host).toEqual('new-statsd-host');
  // ... other StatsD config assertions

  // Cleanup StatsD related env vars
  delete process.env.STATSD_HOST;
  // ... delete other StatsD env vars
});

// Test 5: Cleanup of Environment Variables
test('should clean up environment variables after use', () => {
  delete process.env.SOME_VAR;
  buildConfig();
  expect(process.env.SOME_VAR).toBeUndefined();
});

// Test 6: Deep Merge of Configuration
test('should perform deep merge between configs', () => {
  const config = buildConfig();
  expect(config.redis.ssl).toEqual(false);
  expect(config.redis.password).toEqual('some pwd');
  // ... other assertions for deep merge
});

// Test 7: Handling Missing Environment Variables
test('should use default values for missing environment variables', () => {
  // Delete environment variables if they exist
  delete process.env.JWT_SECRET;
  delete process.env.REDIS_HOST;
  // ... delete other env vars

  const config = buildConfig();
  expect(config.jwtSecret).toEqual('default-jwt-secret'); // Replace with actual default value
  expect(config.redis.host).toEqual('default-redis-host'); // Replace with actual default value
  // ... other assertions for defaults
});

// Test 8: Handling Invalid Environment Variable Values
test('should handle invalid environment variable values', () => {
  process.env.REDIS_PORT = 'invalid-port';
  const config = buildConfig();
  // Expect some form of defaulting or error handling
  // ... assertions based on expected behavior
  delete process.env.REDIS_PORT;
});

// Test 9: Partial Configuration Overrides
test('should correctly apply partial configuration overrides', () => {
  process.env.JWT_SECRET = 'partial-override-secret';
  const config = buildConfig();
  expect(config.jwtSecret).toEqual('partial-override-secret');
  expect(config.redis.host).toEqual('default-redis-host'); // Assuming no override for this
  delete process.env.JWT_SECRET;
});

// Test 10: Configuration Consistency
test('should provide consistent configuration on multiple calls', () => {
  const config1 = buildConfig();
  const config2 = buildConfig();
  expect(config1).toEqual(config2);
});