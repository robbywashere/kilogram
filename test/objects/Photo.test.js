const assert = require('assert');
const { Photo } = require('../../models');
const minioObj = require('../../server-lib/minio/minioObject');
const DBSync = require('../../db/sync');
const { Op } = require('sequelize');

describe('Photo object', () => {
  beforeEach(() => DBSync(true));

  it.skip('should', async () => {});
});
