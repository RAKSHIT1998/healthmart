process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789012345678901234';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-012345678901234567890123';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:65535/placeholder';
process.env.MARG_INTEGRATION_MODE = 'disabled';
process.env.MONGOMS_MD5_CHECK = 'false';
